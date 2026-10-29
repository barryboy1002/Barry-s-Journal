---
title: Atobold 0.0.2: From a 512-Byte BIOS Boot Sector to a 32-Bit Protected Mode C Kernel
date: 2026-10-29
tags: osdev, x86, c, assembly, kernel
summary: Architectural notes on building Atobold 0.0.2 from first principles—transitioning the CPU from 16-bit real mode into 32-bit protected mode with IDT fault handling and serial debugging.
---

Building an operating system kernel from scratch leaves nowhere to hide. Every abstraction you normally take for granted—standard libraries, memory protection, stack frames, and even printing a single character to the screen—must be forged manually at the hardware boundary.

**Atobold 0.0.2** ([barryboy1002/Atobold0.0.2](https://github.com/barryboy1002/Atobold0.0.2)) is my second iteration ("retrial of an OS") of a 32-bit x86 educational operating system kernel built from first principles.

---

## 1. The 512-Byte Boot Pipeline

When an x86 machine boots under legacy BIOS, the firmware loads the first 512-byte sector from disk (ending with the magic signature `0xAA55`) into physical address `0x7C00` in **16-bit Real Mode**.

In `bootloader/bootloader.asm`, the primary objective is deterministic simplicity:
- Establish a known segment state and temporary stack.
- Use BIOS interrupt `INT 13h` to read the kernel payload sectors from disk into memory at `0x9000`.
- Transfer control directly to the kernel entry stub.

## 2. Crossing into 32-Bit Protected Mode

16-bit Real Mode limits addressing to 1 MB and provides zero hardware-enforced privilege separation. Inside `kernel/basic_kernel.asm`, the CPU transition sequence executes:

1. Disable maskable interrupts (`cli`).
2. Load the **Global Descriptor Table (GDT)** via `lgdt`, defining flat 4 GB code and data segment descriptors.
3. Set the Protection Enable (`PE`) bit (bit 0) in Control Register `CR0`.
4. Execute a far jump (`jmp 0x08:protected_mode_entry`) to flush the CPU instruction pipeline and load `CS` with the 32-bit code selector.

```nasm
; Enable 32-bit Protected Mode
cli
lgdt [gdt_descriptor]
mov eax, cr0
or eax, 0x1
mov cr0, eax
jmp CODE_SEG:init_pm
```

Once in 32-bit mode, segment registers and the kernel stack pointer (`ESP`) are initialized, and execution jumps into freestanding C (`kernel_main`).

## 3. Interrupts, Faults, and Early Telemetry

One of the easiest traps in early OS development is flying blind when a Triple Fault resets the CPU. Before adding complex subsystems, Atobold 0.0.2 establishes two critical diagnostic channels:

- **VGA Text Console (`0xB8000`)**: A memory-mapped 80x25 character buffer driver (`kernel/drivers/vga_text.c`) for direct visual output.
- **Polled 16550 UART Serial Driver (`COM1` / `0x3F8`)**: Allows headless execution in QEMU (`make run` / `make test`) with kernel logs and panic register dumps routed straight to host `stdio`.

Alongside these drivers, the **Interrupt Descriptor Table (IDT)** (`kernel/interrupts.c` and `kernel/isr.asm`) catches CPU exceptions (such as Divide-by-Zero or General Protection Faults) and outputs a structured register state dump over both VGA and `COM1`.

---

## 4. Next Milestones on the Roadmap

With the boot pipeline, exception handling, and headless test harness (`tools/boot_test.sh`) verified, the upcoming engineering milestones for Atobold are:

1. **8259 PIC Remapping & Hardware IRQs**: Remapping hardware interrupts away from reserved CPU exception vectors (`0x20`–`0x2F`), followed by the PIT (`IRQ 0`) system timer and PS/2 Keyboard (`IRQ 1`) driver.
2. **Memory Management**: Parsing the BIOS `E820` memory map, implementing a Physical Memory Manager (PMM) page-frame allocator, and enabling two-level x86 paging (VMM).
3. **Ring 3 & Multitasking**: Task State Segment (TSS) setup, user-space isolation, and preemptive context switching.

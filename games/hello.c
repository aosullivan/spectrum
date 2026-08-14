// Smoke test for the file-based build path.
// Build and run it with: /play?src=hello.c
// Toolchain: z88dk. Target: 48K Spectrum. Output: .tap

#include <stdio.h>
#include <input.h>
#include <arch/zx.h>

int main(void) {
    // Black border, white paper, blue ink, no flash, no bright
    zx_border(INK_BLACK);
    zx_cls(PAPER_WHITE | INK_BLUE);

    // The sdcc_iy console driver does not implement the BASIC AT control
    // code, so lay the text out with plain newlines and spaces.
    printf("\n\n     HELLO, SPECTRUM!\n\n");
    printf("  Edited on disk, rebuilt.\n\n\n");
    printf("     Press any key...\n");

    in_wait_key();

    // Flash the border to prove we're alive
    for (int i = 0; i < 8; i++) {
        zx_border(i);
        for (long d = 0; d < 30000; d++) { /* busy wait */ }
    }

    return 0;
}

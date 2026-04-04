import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string) {
    this.open(message, 'success-snackbar');
  }

  error(message: string) {
    this.open(message, 'error-snackbar', 5200);
  }

  info(message: string) {
    this.open(message, 'info-snackbar');
  }

  private open(message: string, panelClass: string, duration = 3600) {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass
    });
  }
}

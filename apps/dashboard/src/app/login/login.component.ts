import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Task Management</h1>
          <p class="text-gray-600">Sign in to your account</p>
        </div>

        @if (error) {
          <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ error }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              [(ngModel)]="credentials.email"
              name="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              [(ngModel)]="credentials.password"
              name="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-600 font-semibold mb-2">Test Credentials:</p>
          <div class="space-y-1 text-xs text-gray-600">
            <p><strong>Owner:</strong> owner@parent.com / password123</p>
            <p><strong>Admin:</strong> admin@parent.com / password123</p>
            <p><strong>Viewer:</strong> viewer@child.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  
  loading = false;
  error = '';

  onSubmit(): void {
    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = 'Invalid email or password';
        this.loading = false;
      }
    });
  }
}

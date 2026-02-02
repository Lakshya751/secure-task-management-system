// ============================================================================
// MODELS AND INTERFACES (from @app/data)
// ============================================================================

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskCategory {
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  DOCUMENTATION = 'DOCUMENTATION',
  RESEARCH = 'RESEARCH',
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  orderIndex: number;
  organizationId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  organizationId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  orderIndex?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  orderIndex?: number;
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from localStorage on init
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  canCreate(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
  }

  canEdit(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
  }

  canDelete(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
  }
}

// ============================================================================
// TASK SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${environment.apiUrl}/tasks`)
      .pipe(
        tap(tasks => this.tasksSubject.next(tasks))
      );
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(`${environment.apiUrl}/tasks`, task)
      .pipe(
        tap(newTask => {
          const current = this.tasksSubject.value;
          this.tasksSubject.next([...current, newTask]);
        })
      );
  }

  updateTask(id: number, updates: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${environment.apiUrl}/tasks/${id}`, updates)
      .pipe(
        tap(updatedTask => {
          const current = this.tasksSubject.value;
          const index = current.findIndex(t => t.id === id);
          if (index !== -1) {
            current[index] = updatedTask;
            this.tasksSubject.next([...current]);
          }
        })
      );
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/tasks/${id}`)
      .pipe(
        tap(() => {
          const current = this.tasksSubject.value;
          this.tasksSubject.next(current.filter(t => t.id !== id));
        })
      );
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, TaskService, Task, TaskStatus, TaskCategory, CreateTaskDto, UpdateTaskDto, UserRole } from '../services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Task Dashboard</h1>
              @if (currentUser) {
                <p class="text-sm text-gray-600 mt-1">
                  {{ currentUser.email }} • 
                  <span class="font-medium" [class]="getRoleBadgeClass(currentUser.role)">
                    {{ currentUser.role }}
                  </span>
                </p>
              }
            </div>
            <button
              (click)="logout()"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Action Bar -->
        <div class="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div class="flex gap-2 flex-wrap">
            <select
              [(ngModel)]="filterCategory"
              (change)="applyFilters()"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="FEATURE">Feature</option>
              <option value="BUG">Bug</option>
              <option value="DOCUMENTATION">Documentation</option>
              <option value="RESEARCH">Research</option>
            </select>

            <select
              [(ngModel)]="filterStatus"
              (change)="applyFilters()"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          @if (canCreate) {
            <button
              (click)="openCreateModal()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + New Task
            </button>
          }
        </div>

        <!-- Task Columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- TODO Column -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h2 class="font-semibold text-gray-700 mb-4 flex items-center justify-between">
              <span>📋 To Do</span>
              <span class="text-sm bg-gray-200 px-2 py-1 rounded">{{ getTasksByStatus('TODO').length }}</span>
            </h2>
            <div class="space-y-3">
              @for (task of getTasksByStatus('TODO'); track task.id) {
                <div
                  class="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border-l-4"
                  [class.border-blue-500]="task.category === 'FEATURE'"
                  [class.border-red-500]="task.category === 'BUG'"
                  [class.border-green-500]="task.category === 'DOCUMENTATION'"
                  [class.border-purple-500]="task.category === 'RESEARCH'"
                  draggable="true"
                  (dragstart)="onDragStart(task)"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event, 'TODO')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
                    @if (canEdit || canDelete) {
                      <button
                        (click)="openEditModal(task)"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        ⋯
                      </button>
                    }
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between text-xs">
                    <span class="px-2 py-1 rounded" [class]="getCategoryBadgeClass(task.category)">
                      {{ task.category }}
                    </span>
                    <span class="text-gray-500">Org {{ task.organizationId }}</span>
                  </div>
                </div>
              }
              @if (getTasksByStatus('TODO').length === 0) {
                <p class="text-center text-gray-400 py-8">No tasks</p>
              }
            </div>
          </div>

          <!-- IN_PROGRESS Column -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h2 class="font-semibold text-gray-700 mb-4 flex items-center justify-between">
              <span>🚀 In Progress</span>
              <span class="text-sm bg-gray-200 px-2 py-1 rounded">{{ getTasksByStatus('IN_PROGRESS').length }}</span>
            </h2>
            <div class="space-y-3">
              @for (task of getTasksByStatus('IN_PROGRESS'); track task.id) {
                <div
                  class="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border-l-4"
                  [class.border-blue-500]="task.category === 'FEATURE'"
                  [class.border-red-500]="task.category === 'BUG'"
                  [class.border-green-500]="task.category === 'DOCUMENTATION'"
                  [class.border-purple-500]="task.category === 'RESEARCH'"
                  draggable="true"
                  (dragstart)="onDragStart(task)"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event, 'IN_PROGRESS')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
                    @if (canEdit || canDelete) {
                      <button
                        (click)="openEditModal(task)"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        ⋯
                      </button>
                    }
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between text-xs">
                    <span class="px-2 py-1 rounded" [class]="getCategoryBadgeClass(task.category)">
                      {{ task.category }}
                    </span>
                    <span class="text-gray-500">Org {{ task.organizationId }}</span>
                  </div>
                </div>
              }
              @if (getTasksByStatus('IN_PROGRESS').length === 0) {
                <p class="text-center text-gray-400 py-8">No tasks</p>
              }
            </div>
          </div>

          <!-- DONE Column -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h2 class="font-semibold text-gray-700 mb-4 flex items-center justify-between">
              <span>✅ Done</span>
              <span class="text-sm bg-gray-200 px-2 py-1 rounded">{{ getTasksByStatus('DONE').length }}</span>
            </h2>
            <div class="space-y-3">
              @for (task of getTasksByStatus('DONE'); track task.id) {
                <div
                  class="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border-l-4 opacity-75"
                  [class.border-blue-500]="task.category === 'FEATURE'"
                  [class.border-red-500]="task.category === 'BUG'"
                  [class.border-green-500]="task.category === 'DOCUMENTATION'"
                  [class.border-purple-500]="task.category === 'RESEARCH'"
                  draggable="true"
                  (dragstart)="onDragStart(task)"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event, 'DONE')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
                    @if (canEdit || canDelete) {
                      <button
                        (click)="openEditModal(task)"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        ⋯
                      </button>
                    }
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between text-xs">
                    <span class="px-2 py-1 rounded" [class]="getCategoryBadgeClass(task.category)">
                      {{ task.category }}
                    </span>
                    <span class="text-gray-500">Org {{ task.organizationId }}</span>
                  </div>
                </div>
              }
              @if (getTasksByStatus('DONE').length === 0) {
                <p class="text-center text-gray-400 py-8">No tasks</p>
              }
            </div>
          </div>
        </div>
      </main>

      <!-- Create/Edit Modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg max-w-md w-full p-6">
            <h2 class="text-xl font-bold mb-4">{{ editingTask ? 'Edit Task' : 'Create New Task' }}</h2>
            
            <form (ngSubmit)="saveTask()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  [(ngModel)]="taskForm.title"
                  name="title"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  [(ngModel)]="taskForm.description"
                  name="description"
                  rows="3"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  [(ngModel)]="taskForm.category"
                  name="category"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FEATURE">Feature</option>
                  <option value="BUG">Bug</option>
                  <option value="DOCUMENTATION">Documentation</option>
                  <option value="RESEARCH">Research</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  [(ngModel)]="taskForm.status"
                  name="status"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {{ editingTask ? 'Update' : 'Create' }}
                </button>
                @if (editingTask && canDelete) {
                  <button
                    type="button"
                    (click)="deleteTask()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                }
                <button
                  type="button"
                  (click)="closeModal()"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentUser = this.authService.getCurrentUser();
  
  filterCategory = '';
  filterStatus = '';
  
  showModal = false;
  editingTask: Task | null = null;
  draggedTask: Task | null = null;
  
  taskForm = {
    title: '',
    description: '',
    category: 'FEATURE' as TaskCategory,
    status: 'TODO' as TaskStatus,
  };

  get canCreate() {
    return this.authService.canCreate();
  }

  get canEdit() {
    return this.authService.canEdit();
  }

  get canDelete() {
    return this.authService.canDelete();
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      const categoryMatch = !this.filterCategory || task.category === this.filterCategory;
      const statusMatch = !this.filterStatus || task.status === this.filterStatus;
      return categoryMatch && statusMatch;
    });
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  openCreateModal() {
    this.editingTask = null;
    this.taskForm = {
      title: '',
      description: '',
      category: 'FEATURE',
      status: 'TODO',
    };
    this.showModal = true;
  }

  openEditModal(task: Task) {
    this.editingTask = task;
    this.taskForm = {
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingTask = null;
  }

  saveTask() {
    if (this.editingTask) {
      // Update existing task
      const updates: UpdateTaskDto = this.taskForm;
      this.taskService.updateTask(this.editingTask.id, updates).subscribe({
        next: () => {
          this.loadTasks();
          this.closeModal();
        },
        error: (err) => {
          alert('Error updating task: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      // Create new task
      const newTask: CreateTaskDto = this.taskForm;
      this.taskService.createTask(newTask).subscribe({
        next: () => {
          this.loadTasks();
          this.closeModal();
        },
        error: (err) => {
          alert('Error creating task: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }

  deleteTask() {
    if (this.editingTask && confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(this.editingTask.id).subscribe({
        next: () => {
          this.loadTasks();
          this.closeModal();
        },
        error: (err) => {
          alert('Error deleting task: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }

  // Drag and Drop
  onDragStart(task: Task) {
    this.draggedTask = task;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, newStatus: TaskStatus) {
    event.preventDefault();
    
    if (this.draggedTask && this.draggedTask.status !== newStatus && this.canEdit) {
      const updates: UpdateTaskDto = { status: newStatus };
      this.taskService.updateTask(this.draggedTask.id, updates).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          alert('Error moving task: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
    this.draggedTask = null;
  }

  getCategoryBadgeClass(category: TaskCategory): string {
    const classes = {
      'FEATURE': 'bg-blue-100 text-blue-800',
      'BUG': 'bg-red-100 text-red-800',
      'DOCUMENTATION': 'bg-green-100 text-green-800',
      'RESEARCH': 'bg-purple-100 text-purple-800',
    };
    return classes[category] || 'bg-gray-100 text-gray-800';
  }

  getRoleBadgeClass(role: UserRole): string {
    const classes = {
      'OWNER': 'text-purple-600',
      'ADMIN': 'text-blue-600',
      'VIEWER': 'text-gray-600',
    };
    return classes[role] || 'text-gray-600';
  }

  logout() {
    this.authService.logout();
  }
}

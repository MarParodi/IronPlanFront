import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from './services/notification.service';
import { NotificationDto, NotificationType } from './models/notification.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDto[] = [];
  loading = true;
  error: string | null = null;

  // Paginación
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;
  unreadCount = 0;

  // Filtros
  showUnreadOnly = false;
  selectedType: NotificationType | null = null;

  // Modal de confirmación
  showDeleteAllModal = false;
  deleting = false;

  types: { value: NotificationType | null; label: string }[] = [
    { value: null, label: 'Todas' },
    { value: 'SUCCESS', label: 'Éxito' },
    { value: 'INFO', label: 'Info' },
    { value: 'WARNING', label: 'Aviso' },
    { value: 'ERROR', label: 'Error' }
  ];

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;

    this.notificationService.getNotifications({
      page: this.page,
      size: this.size,
      unreadOnly: this.showUnreadOnly || undefined,
      type: this.selectedType || undefined
    }).subscribe({
      next: (response) => {
        this.notifications = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.unreadCount = response.unreadCount;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando notificaciones:', err);
        this.error = 'No se pudieron cargar las notificaciones';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ============ FILTROS ============

  onToggleUnreadOnly(): void {
    this.showUnreadOnly = !this.showUnreadOnly;
    this.page = 0;
    this.loadNotifications();
  }

  onSelectType(type: NotificationType | null): void {
    this.selectedType = type;
    this.page = 0;
    this.loadNotifications();
  }

  // ============ PAGINACIÓN ============

  onPreviousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadNotifications();
    }
  }

  onNextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadNotifications();
    }
  }

  // ============ ACCIONES ============

  onNotificationClick(notification: NotificationDto): void {
    // Marcar como leída si no lo está
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          notification.isRead = updated.isRead;
          notification.readAt = updated.readAt;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.markForCheck();
        }
      });
    }

    // Navegar a la ruta si existe
    if (notification.routeUrl) {
      this.router.navigateByUrl(notification.routeUrl);
    }
  }

  onToggleRead(event: Event, notification: NotificationDto): void {
    event.stopPropagation();
    
    if (notification.isRead) {
      this.notificationService.markAsUnread(notification.id).subscribe({
        next: (updated) => {
          notification.isRead = updated.isRead;
          notification.readAt = updated.readAt;
          this.unreadCount++;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          notification.isRead = updated.isRead;
          notification.readAt = updated.readAt;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.markForCheck();
        }
      });
    }
  }

  onDeleteNotification(event: Event, notification: NotificationDto): void {
    event.stopPropagation();
    
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (!notification.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.totalElements--;
        this.cdr.markForCheck();
      }
    });
  }

  onMarkAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        this.unreadCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  onOpenDeleteAllModal(): void {
    this.showDeleteAllModal = true;
  }

  onCloseDeleteAllModal(): void {
    this.showDeleteAllModal = false;
  }

  onConfirmDeleteAll(): void {
    this.deleting = true;
    this.notificationService.deleteAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.totalElements = 0;
        this.deleting = false;
        this.showDeleteAllModal = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.deleting = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ============ HELPERS ============

  getTypeIcon(type: NotificationType): string {
    return this.notificationService.getTypeIcon(type);
  }

  getTypeColor(type: NotificationType): string {
    return this.notificationService.getTypeColor(type);
  }

  getTypeBgColor(type: NotificationType): string {
    return this.notificationService.getTypeBgColor(type);
  }

  formatTime(dateStr: string): string {
    return this.notificationService.formatRelativeTime(dateStr);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  trackByNotification(index: number, notification: NotificationDto): number {
    return notification.id;
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { RoomDetails } from '../../app.models';
import { ROOM_PAGE_DATA_DEFAULT } from '../../app.constants';
import { ApiService } from '../../core/services/api';
import { tap, catchError } from 'rxjs';
import { NavigationLinkSegment, Path, ToastMessage, MessageType } from '../../app.enum';
import { UrlService } from '../../core/services/url';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  readonly #apiService = inject(ApiService);
  readonly #urlService = inject(UrlService);
  readonly #router = inject(Router);
  readonly #toasterService = inject(ToastService);

  public roomData = signal<RoomDetails>(ROOM_PAGE_DATA_DEFAULT);

  public readonly invitationLink = computed(
    () =>
      this.#urlService.getNavigationLinks(
        this.roomData().invitationCode,
        NavigationLinkSegment.Join
      ).absoluteUrl
  );

  public readonly isRoomDrawn = computed(() => !!this.roomData().closedOn);

  public getRoomByUserCode(code: string) {
    this.#apiService
      .getRoomByUserCode(code)
      .pipe(
        tap((result) => {
          if (result?.body) {
            this.roomData.set(result.body);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // If 404, user was kicked or room not found, redirect to home
          if (error.status === 404 && code) {
            this.#toasterService.show(
              ToastMessage.UnavailableRoom,
              MessageType.Error
            );
            this.#router.navigate([Path.Home]);
          }
          return of(null);
        })
      )
      .subscribe();
  }
}

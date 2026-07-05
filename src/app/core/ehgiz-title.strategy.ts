import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Appends the brand suffix to every route title; falls back to the plain brand name. */
@Injectable({ providedIn: 'root' })
export class EhgizTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} · Ehgiz` : 'Ehgiz — P2P Tool Rental Platform');
  }
}

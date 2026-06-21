import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [

  // Default redirect
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth (public)
  { path: 'login',        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),               canActivate: [guestGuard] },
  { path: 'register',     loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),       canActivate: [guestGuard] },
  { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), canActivate: [guestGuard] },

  // Admin
  { path: 'admin', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard, () => import('./core/guards/admin.guard').then(m => m.adminGuard)] },

  // Dashboard & Profile
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'profile',   loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),       canActivate: [authGuard] },

  // Tools — browse & detail are public (API AllowAnonymous)
  { path: 'browse',         loadComponent: () => import('./features/tools/browse-page/browse-page.component').then(m => m.BrowsePageComponent), data: { layout: 'full' } },
  { path: 'tools',          loadComponent: () => import('./features/tools/my-tools/my-tools.component').then(m => m.MyToolsComponent), canActivate: [authGuard] },
  { path: 'tools/create',   loadComponent: () => import('./features/tools/add-tool/add-tool.component').then(m => m.AddToolComponent), canActivate: [authGuard] },
  { path: 'tools/:id/edit', loadComponent: () => import('./features/tools/edit-tool/edit-tool.component').then(m => m.EditToolComponent), canActivate: [authGuard] },
  { path: 'tools/:id',      loadComponent: () => import('./features/tools/tool-detail/tool-detail.component').then(m => m.ToolDetailComponent), data: { layout: 'full' } },
  { path: 'add-tool',       redirectTo: 'tools/create', pathMatch: 'full' },

  // Bookings
  { path: 'bookings',        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent),     canActivate: [authGuard] },
  { path: 'bookings/create', loadComponent: () => import('./features/bookings/booking-create/booking-create.component').then(m => m.BookingCreateComponent), canActivate: [authGuard] },
  { path: 'bookings/:id',    loadComponent: () => import('./features/bookings/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent), canActivate: [authGuard] },

  // Reviews
  { path: 'reviews',        loadComponent: () => import('./features/reviews/review-list/review-list.component').then(m => m.ReviewListComponent),     canActivate: [authGuard] },
  { path: 'reviews/create', loadComponent: () => import('./features/reviews/review-create/review-create.component').then(m => m.ReviewCreateComponent), canActivate: [authGuard] },

  // Messages
  { path: 'messages',     loadComponent: () => import('./features/messages/conversation-list/conversation-list.component').then(m => m.ConversationListComponent), canActivate: [authGuard] },
  { path: 'messages/:id', loadComponent: () => import('./features/messages/chat/chat.component').then(m => m.ChatComponent),                                       canActivate: [authGuard] },

  // Payments
  { path: 'payments/initiate', loadComponent: () => import('./features/payments/payment-initiate/payment-initiate.component').then(m => m.PaymentInitiateComponent), canActivate: [authGuard] },
  { path: 'payments/:id',      loadComponent: () => import('./features/payments/payment-status/payment-status.component').then(m => m.PaymentStatusComponent),       canActivate: [authGuard] },

  // Notifications
  { path: 'notifications', loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent), canActivate: [authGuard] },

  // AI Features
  { path: 'ai/classification', loadComponent: () => import('./features/ai/classification/classification.component').then(m => m.ClassificationComponent),  canActivate: [authGuard] },
  { path: 'ai/image-analysis', loadComponent: () => import('./features/ai/image-analysis/image-analysis.component').then(m => m.ImageAnalysisComponent),  canActivate: [authGuard] },
  { path: 'ai/image-search',   loadComponent: () => import('./features/ai/image-search/image-search.component').then(m => m.ImageSearchComponent),        canActivate: [authGuard] },
  { path: 'ai/rag-search',     loadComponent: () => import('./features/ai/rag-search/rag-search.component').then(m => m.RagSearchComponent),              canActivate: [authGuard] },

  // Static pages
  { path: 'how-it-works', loadComponent: () => import('./features/pages/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent) },
  { path: 'pricing',      loadComponent: () => import('./features/pages/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'help',         loadComponent: () => import('./features/pages/help/help.component').then(m => m.HelpComponent) },
  { path: 'safety',       loadComponent: () => import('./features/pages/safety/safety.component').then(m => m.SafetyComponent) },
  { path: 'insurance',    loadComponent: () => import('./features/pages/insurance/insurance.component').then(m => m.InsuranceComponent) },
  { path: 'contact',      loadComponent: () => import('./features/pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'terms',        loadComponent: () => import('./features/pages/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'privacy',      loadComponent: () => import('./features/pages/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'cookie',       loadComponent: () => import('./features/pages/cookie/cookie.component').then(m => m.CookieComponent) },

  // Fallback
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];

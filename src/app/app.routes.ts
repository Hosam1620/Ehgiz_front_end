import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  // Public landing page (default route) — logged-in users are sent to /dashboard
  { path: '', title: 'Rent tools from your neighbors', loadComponent: () => import('./features/home/landing.component').then(m => m.LandingComponent), pathMatch: 'full', canActivate: [guestGuard], data: { layout: 'full' } },

  // Auth (public)
  { path: 'login', title: 'Sign in',        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),               canActivate: [guestGuard] },
  { path: 'register', title: 'Create account',     loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),       canActivate: [guestGuard] },
  { path: 'verify-email', title: 'Verify email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', title: 'Reset password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },

  // Admin
  { path: 'admin', title: 'Admin panel', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard, adminGuard], data: { layout: 'admin' } },

  // Dashboard & Profile
  { path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'profile', title: 'Profile',   loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),       canActivate: [authGuard] },

  // Tools — browse & detail are public (API AllowAnonymous)
  { path: 'browse', title: 'Browse tools',         loadComponent: () => import('./features/tools/browse-page/browse-page.component').then(m => m.BrowsePageComponent), data: { layout: 'full' } },
  { path: 'tools', title: 'My tools',          loadComponent: () => import('./features/tools/my-tools/my-tools.component').then(m => m.MyToolsComponent), canActivate: [authGuard] },
  { path: 'saved-searches', title: 'Saved searches', loadComponent: () => import('./features/saved-searches/saved-searches.component').then(m => m.SavedSearchesComponent), canActivate: [authGuard] },
  { path: 'tools/create', title: 'Add a tool',   loadComponent: () => import('./features/tools/add-tool/add-tool.component').then(m => m.AddToolComponent), canActivate: [authGuard] },
  { path: 'tools/:id/edit', title: 'Edit tool', loadComponent: () => import('./features/tools/edit-tool/edit-tool.component').then(m => m.EditToolComponent), canActivate: [authGuard] },
  { path: 'tools/:id', title: 'Tool details',      loadComponent: () => import('./features/tools/tool-detail/tool-detail.component').then(m => m.ToolDetailComponent), data: { layout: 'full' } },
  { path: 'add-tool',       redirectTo: 'tools/create', pathMatch: 'full' },

  // Wallet — child route must be listed first so prefix matching on 'wallet' doesn't shadow it
  { path: 'wallet/topup/return', title: 'Wallet top-up', loadComponent: () => import('./features/wallet/wallet-topup-return/wallet-topup-return.component').then(m => m.WalletTopupReturnComponent), canActivate: [authGuard] },
  { path: 'wallet', title: 'Wallet', loadComponent: () => import('./features/wallet/wallet.component').then(m => m.WalletComponent), canActivate: [authGuard] },

  // Bookings
  { path: 'bookings', title: 'My bookings',        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent),     canActivate: [authGuard] },
  { path: 'bookings/create', title: 'New booking', loadComponent: () => import('./features/bookings/booking-create/booking-create.component').then(m => m.BookingCreateComponent), canActivate: [authGuard] },
  { path: 'bookings/:id', title: 'Booking details',    loadComponent: () => import('./features/bookings/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent), canActivate: [authGuard] },

  // Reviews
  { path: 'reviews', title: 'Reviews',        loadComponent: () => import('./features/reviews/review-list/review-list.component').then(m => m.ReviewListComponent),     canActivate: [authGuard] },
  { path: 'reviews/create', title: 'Write a review', loadComponent: () => import('./features/reviews/review-create/review-create.component').then(m => m.ReviewCreateComponent), canActivate: [authGuard] },

  // Messages
  { path: 'messages', title: 'Messages',     loadComponent: () => import('./features/messages/conversation-list/conversation-list.component').then(m => m.ConversationListComponent), canActivate: [authGuard] },
  { path: 'messages/:id', title: 'Chat', loadComponent: () => import('./features/messages/chat/chat.component').then(m => m.ChatComponent),                                       canActivate: [authGuard] },

  // Notifications
  { path: 'notifications', title: 'Notifications', loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent), canActivate: [authGuard] },

  // AI Features
  { path: 'ai/image-search', title: 'Search by photo',   loadComponent: () => import('./features/ai/image-search/image-search.component').then(m => m.ImageSearchComponent),        data: { layout: 'full' } },

  // Static pages
  { path: 'how-it-works', title: 'How it works', loadComponent: () => import('./features/pages/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent) },
  { path: 'pricing', title: 'Pricing',      loadComponent: () => import('./features/pages/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'help', title: 'Help center',         loadComponent: () => import('./features/pages/help/help.component').then(m => m.HelpComponent) },
  { path: 'safety', title: 'Safety guide',       loadComponent: () => import('./features/pages/safety/safety.component').then(m => m.SafetyComponent) },
  { path: 'insurance', title: 'Insurance',    loadComponent: () => import('./features/pages/insurance/insurance.component').then(m => m.InsuranceComponent) },
  { path: 'contact', title: 'Contact us',      loadComponent: () => import('./features/pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'terms', title: 'Terms of service',        loadComponent: () => import('./features/pages/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'privacy', title: 'Privacy policy',      loadComponent: () => import('./features/pages/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'cookie', title: 'Cookie policy',       loadComponent: () => import('./features/pages/cookie/cookie.component').then(m => m.CookieComponent) },

  // Fallback
  { path: '**', title: 'Page not found', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];

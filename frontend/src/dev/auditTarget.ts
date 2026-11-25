export type AuditTarget =
  | null
  | 'onboarding_dark'
  | 'auth_entry'
  | 'mobile_login'
  | 'email_login'
  | 'email_login_error'
  | 'email_signup'
  | 'forgot_password'
  | 'reset_password'
  | 'otp_empty'
  | 'otp_typed'
  | 'otp_error'
  | 'profile_setup'
  | 'home'
  | 'friends_main'
  | 'friends_requests'
  | 'friends_search_empty'
  | 'friends_add_sheet'
  | 'friends_guest_sheet'
  | 'friends_person_sheet'
  | 'friends_remove_sheet';

export const AUDIT_TARGET: AuditTarget = null;

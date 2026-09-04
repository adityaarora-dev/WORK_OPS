# Stage 12: Enterprise Hardening, Mobile App & SSO Integrations — Internal Project Plan

## Stage Title
**Stage 12 — Enterprise Hardening, Single Sign-On (SSO) & Mobile Applications**

## Current Status
**Not Started** (Production security baseline and automated integration tests completed; SAML/OAuth SSO and mobile apps pending)

---

## What Has Already Been Completed
1. **Security Baseline & Hardening**:
   - Helmet security headers (`X-Frame-Options`, `X-Content-Type-Options`).
   - Rate limiting on API and authentication routes (`express-rate-limit`).
   - Strict CORS whitelist for local and production domains.
   - Resource-level ID manipulation authorization guards preventing horizontal privilege escalation.
   - Dual-mode authentication (stateless JWT + live Google Gmail SMTP OTP + Forgot Password reset flow).
2. **Automated Verification**:
   - 9 test suites verifying 181+ assertions across all modules.

---

## What Is Pending
1. **Single Sign-On (SSO) & Identity Federation**:
   - SAML 2.0 / OpenID Connect (OIDC) integration for Microsoft Entra ID (Azure AD), Okta, and Google Workspace.
   - Automatic SCIM user provisioning and de-provisioning.
2. **Mobile Application (React Native / Flutter)**:
   - Dedicated mobile apps for iOS and Android.
   - Geofenced mobile clock-in/out with GPS verification.
   - Push notifications via Apple APNs and Firebase Cloud Messaging (FCM).
3. **Multi-Factor Authentication (MFA / TOTP)**:
   - Authenticator app support (Google Authenticator, Microsoft Authenticator) via RFC 6238 TOTP QR codes.
   - Hardware security key support (FIDO2 / WebAuthn).
4. **Data Encryption at Rest (Field-Level Encryption)**:
   - Mongoose field-level encryption for highly sensitive fields (government IDs, bank account numbers).

---

## Future Implementation Plan

### Phase 1: SSO & OIDC Federation
- Integrate `passport-saml` or `openid-client` into Express backend.
- Provide corporate "Login with Google Workspace" and "Login with Microsoft 365" buttons.

### Phase 2: MFA / TOTP Authenticator Support
- Add `speakeasy` and `qrcode` libraries.
- Create user profile settings screen for enabling 2FA.

### Phase 3: Mobile App Development
- Initialize React Native / Expo workspace sharing existing API client logic.
- Implement biometric authentication (Face ID / Fingerprint) for rapid clock-in.

---

## Next Action Items
1. [ ] Create Microsoft Azure AD developer tenant for SAML testing.
2. [ ] Evaluate `speakeasy` vs `otplib` for RFC 6238 TOTP generation.
3. [ ] Define geofencing coordinates format for mobile clock-in restrictions.

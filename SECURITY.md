# Security Policy

Thank you for helping keep **BogleConvert** and its users safe. We take security seriously and appreciate responsible disclosure.

---

## 🔒 Reporting a Vulnerability

### Primary Method: GitHub Private Vulnerability Reporting

We use GitHub's **Private Vulnerability Reporting** feature for secure, confidential disclosure.

**To report:**

1. Navigate to the [BogleConvert GitHub repository](https://github.com/midmichiganconnections/BogleConvert).
2. Click on the **"Security"** tab.
3. Select **"Report a vulnerability"** (under "Private vulnerability reporting").
4. Fill out the form with details about the issue.

Your report will be visible only to repository maintainers until a fix is released.

### Secondary Method: Email

If you are unable to use GitHub's reporting feature, you may alternatively email the address found in the **Support/Donation section** of the application (the Proton email revealed via Turnstile verification).

Please include:
- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (optional but appreciated)

---

## 📋 Scope

The following are **in scope** for security reports:

- The main BogleConvert web application
- Cloudflare Worker API endpoints (`/api/*`)
- Data handling and storage logic
- Authentication or authorization bypasses
- Cross-site scripting (XSS) or injection vulnerabilities
- Sensitive data exposure

### Out of Scope

The following are **explicitly excluded** from the bug bounty scope:

- **The Donation/Turnstile mechanism** — Unless you discover that it leaks personal data (e.g., exposes the protected email without completing the challenge), issues with the donation flow itself are not in scope.
- Denial of service (DoS) attacks
- Social engineering attacks
- Issues in third-party dependencies unless directly exploitable in BogleConvert
- Vulnerabilities requiring physical access to a user's device

---

## 🕐 Response Timeline

We aim to:
- Acknowledge receipt within **48 hours**
- Provide an initial assessment within **7 days**
- Release a fix for valid vulnerabilities within **30 days** (depending on complexity)

---

## 🙏 Recognition

We're a small team with a $0 budget, so we can't offer monetary rewards. However, we're happy to:
- Credit you in our release notes (with your permission)
- Add you to a `SECURITY_ACKNOWLEDGMENTS.md` file

---

*This policy is governed by Mid Michigan Connections LLC.*

*Last updated: January 2026*

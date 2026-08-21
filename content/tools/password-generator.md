---
title: "Free Password Generator"
date: 2026-08-20
draft: false
weight: 1
description: "Generate a strong random password in your browser. Choose length, capital letters, numbers, and symbols. Nothing is sent to a server."
tags: ["Passwords", "Security"]
faq:
  - question: "Does this password generator send anything to a server?"
    answer: "No. The password is created in your browser with crypto.getRandomValues. Refreshing the page discards it unless you copied it."
  - question: "Should I use symbols?"
    answer: "Yes, when the account allows them. Symbols widen the character set. Turn them off only if a site rejects special characters."
  - question: "What if I need something easier to type?"
    answer: "Use the passphrase generator instead. It builds a memorable phrase from random words."
  - question: "How should I share a generated password?"
    answer: "Do not put it in a chat thread or email. Share it as a temporary note so it is not sitting in history after it has been used."
---

Create a random password on this page, copy it, then share it in a note that can disappear instead of leaving it in chat or email.

## How to use this password generator

1. Set the length. Twelve characters is the default.
2. Keep capital letters, numbers, and symbols on unless a site forbids them.
3. Click Generate until you have one you will use.
4. Click Copy. Do not paste it into Slack, email, or a document that keeps history.
5. If you need to send it to someone, use a [self-destructing note](https://zeronote.app) or see [how to share a password securely](/posts/share-password-securely/).

Lowercase letters are always included so the generator cannot collapse to an empty character set.

## 8, 12, and 16 character passwords

The slider goes from 8 to 64 characters on this same page. There are no separate URLs for each length.

- **8 characters** is the minimum many old sites still allow. It is weak against offline guessing. Use it only when the service will not accept more.
- **12 characters** is the default here. It is a practical floor for most accounts when the password is random.
- **16 characters** is stronger when the site allows a longer password. Length is the cheapest way to add strength.

A random 12-character password with mixed character types is far harder to guess than a short password you invented. Prefer 16 or more when you can.

## Frequently asked questions

### Does this password generator send anything to a server?

No. The password is created in your browser with `crypto.getRandomValues`. Refreshing the page discards it unless you copied it.

### Should I use symbols?

Yes, when the account allows them. Symbols widen the character set. Turn them off only if a site rejects special characters.

### What if I need something easier to type?

Use the [passphrase generator](/tools/passphrase-generator/) instead. It builds a memorable phrase from random words.

### How should I share a generated password?

Do not put it in a chat thread or email. [Share it as a temporary note](/posts/share-password-securely/) so it is not sitting in history after it has been used.

Related:

- [Passphrase Generator](/tools/passphrase-generator/)
- [How to Share a Password Securely](/posts/share-password-securely/)
- [How to Share API Keys Securely](/posts/share-apikeys-securely/)

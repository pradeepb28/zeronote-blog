---
title: "When to Use Views-Based vs Time-Based Message Destruction"
date: 2026-03-20
draft: false
description: "How to decide between view-based and time-based self-destructing messages, depending on what you are sharing."
tags: ["Security", "Privacy", "Message Destruction", "Use Cases"]
---

Not all self-destructing messages should work the same way.

Sometimes the message should disappear after it is opened.

Other times, it makes more sense for it to expire after a specific amount of time, whether it has been viewed or not.

That is the difference between view-based and time-based message destruction.

And choosing the right one depends on what you are trying to protect.

---

## What views-based destruction means

View-based destruction means the message is destroyed after it has been opened or viewed.

The message stays available until that first access happens.

After that, it stops working.

This is useful when the main goal is one-time access.

You care less about the clock and more about the fact that the message should only be seen once.

---

## What time-based destruction means

Time-based destruction means the message expires after a set amount of time.

That window might be a few minutes, an hour, a day, or longer.

In this model, the message has a lifetime based on time, not just on whether it has been opened.

This is useful when the information is only relevant for a certain period.

---

## When view-based destruction makes more sense

View-based destruction is usually the better fit when the message should have one clear readable moment.

For example:

- a password
- a private link
- a recovery code
- a one-time secret
- a note that should only be checked once

In these cases, the main concern is not how many minutes pass.

It is whether the message can still be opened again later.

If the answer should be no, view-based destruction is usually the cleaner choice.

---

## When time-based destruction makes more sense

Time-based destruction is often better when the recipient may need a short access window.

For example:

- temporary instructions
- bank transfer details
- event or meeting information
- directions for a delivery or handoff
- access details that only matter for the next hour or day

Here, the goal is not always “one view only.”

It is more often “this should stop being available after a certain point.”

---

## The practical difference

A simple way to think about it is this:

- **View-based destruction** answers: “Should this still exist after someone has already seen it?”
- **Time-based destruction** answers: “Should this still exist after a certain amount of time has passed?”

That is why they solve different problems.

One controls repeat access.

The other controls lifespan.

---

## Which Zero Note feature fits best

Zero Note supports both models, which is useful because different information needs different rules.

Use **view-based destruction** when:
- the message should only be accessed once
- the first read is the only read that matters
- repeat access is the main risk

Use **time-based destruction** when:
- the recipient may need a short window
- the information is time-sensitive
- the risk is the message lingering too long rather than being viewed twice

If you are not sure which to choose, ask one question:

Is the bigger problem a second view, or a message that stays available for too long?

That usually gives you the answer.

---

## One honest limitation

Neither model can stop someone from saving what they can already see.

A screenshot, copy, or photo is still possible once the message is visible.

But both models still reduce exposure in different ways.

The point is not perfection.

It is better control over how long sensitive information remains accessible.

---

## Final thought

View-based and time-based destruction are similar on the surface, but they are not interchangeable.

Use view-based destruction when one-time access is what matters.

Use time-based destruction when the information only needs to exist for a limited window.

Choosing the right behavior makes the message more useful and more intentional.

---

Related:

- [How to Send Information That Should Only Be Seen Once](/posts/send-information-seen-once/)
- [How to Send Temporary Instructions Securely](/posts/send-temporary-instructions/)
- [How to Share a One-Time Secret Securely](/posts/share-one-time-secret-securely/)

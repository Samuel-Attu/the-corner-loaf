# Sketch and structure note

The [Corner Loaf sketch](sketch/The%20Corner%20Loaf%20sketch.drawio.svg) shows the phone layout from top to bottom.

<img src="sketch/The%20Corner%20Loaf%20sketch.drawio.svg" alt="The original mobile-first sketch for The Corner Loaf website" width="372">

*The original phone-layout sketch.*

**When it was made.** I finished the sketch on 10 November at 9:48 am, and my first commit was at 10:06 am the same morning. The sketch was added to the repository later, with the original project write-up, which is why the commit history shows it after the code.

**Why the page is ordered this way.** Marcus's regulars check the site on their phones while walking past. They are asking three questions, in this order: is it open, what is out today, and where is it. The page answers them in that order, on the first screen. Everything for people planning ahead (the weekly menu, pre-ordering, the FAQ) comes after, because those visitors are willing to scroll and walk-by customers are not.

- **Status and today's bakes are one block.** They answer one question, so they sit together at the top. When the shop is closed, the block says when it opens next and shows what is baking then.
- **Location comes straight after,** with a one-tap directions link for new visitors.
- **The hero banner is gone.** It used the most valuable space on the least useful content.
- **The weekly menu is organised by day,** not by item, because "what can I get on Tuesday?" is the question people ask.
- **About Marcus, then hours and contact, come last.** They give new visitors the small, real feel of the shop, but a regular does not need them to decide.

**What changed between the sketch and the build.** My sketch still had a pre-order form and a "Send us a message" form. I removed both in the build. The original forms meant typing on a phone, which is the biggest cost for someone mid-walk. Pre-ordering now happens on the item itself, and contact is WhatsApp and email. I also dropped the separate description block, since the `h1` does that job.

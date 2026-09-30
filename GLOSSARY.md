# Maowi

An AI-powered study app: lecture files become a shared pool of questions per module, studied as flashcards, multiple choice, or identification.

## Language

**Module**: A named collection of lecture material turned into a question pool. Exactly one user owns it; other users join it through its invitation link.

**Question Pool**: The single shared set of questions per module; mode is a study concern, not a stored type.

**Attempt**: One run through a question pool in a scored mode. The attempt records the answers given and the score they produce; a run that was never finished counts for nothing.

**Owner**: The user who created the module. The owner is the only one who renames or deletes the module, regenerates its invitation link, and removes members. _Avoid_: creator, admin

**Member**: A user who joined a module via its invitation link. Members study the module and compete on its leaderboard; only the Owner manages it. _Avoid_: co-creator, collaborator

**Invitation Link / Invitation Token**: The permanent, multi-use link that lets any signed-in user join a module as a Member. Regenerating it replaces the token and revokes the previous link. _Avoid_: invite code, access code

**Leaderboard**: The ranking of a module's Owner and Members by their study performance.

**Best Score**: A user's highest percentage on a module, or on one of its modes, taken over completed attempts only.

**Username**: The public handle shown next to a user on leaderboards and member lists. _Avoid_: display name, nickname

**Avatar**: The optional picture shown next to a user's username. _Avoid_: profile picture, photo

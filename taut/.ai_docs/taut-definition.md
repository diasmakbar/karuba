Taut Space
1. Core Idea
A cooperative multiplayer puzzle game where every player must solve their own problem, but does not have all the information required to solve it.
The information needed to solve each player's problem is distributed among the other players.
Players must communicate, exchange information, and coordinate simultaneously to solve everyone's problems before the game ends.
The core experience is:
Everyone has a problem. Everyone has part of someone else's solution.

2. The Fundamental Structure
Each player has:
1 Problem / Module that they need to solve.
2 pieces of information required to solve that problem.
Each piece of information is held by a different player.
2 pieces of information to solve another player’s problem.
Therefore, no player can fully solve their own problem alone.
For player A:requires Information 1 from Player X and requires Information 2 from Player Y
Where: X ≠ Y; X ≠ A; Y ≠ A

3. Information Distribution
The information distribution is randomized at the beginning of each game.
For every player, two different players are assigned as their information sources:
Informant 1 → provides Information 1
Informant 2 → provides Information 2
The assignments are generated so that:
Every player has exactly 1 Informant 1.
Every player has exactly 1 Informant 2.
Every player is an Informant 1 for exactly 1 other player.
Every player is an Informant 2 for exactly 1 other player.
Informant 1 and Informant 2 for the same player are always different.
No player can be their own informant.
This creates a balanced information network.

4. Example: Six Players
Players:
A, B, C, D, E, F
One possible randomized assignment:
Player
Informant 1
Informant 2
A
B
E
B
C
F
C
D
A
D
E
B
E
F
C
F
A
D

The actual assignments can be different every game.
The important rule is not the specific pattern, but the constraints:
Each player needs information from exactly two different players.
And:
Each player provides Information 1 to exactly one player and Information 2 to exactly one player.

5. Simultaneous Gameplay
The game is designed around simultaneous problem solving.
There are no conventional turns where one player waits for another player to finish.
While Player A is solving their problem:
Player B may be asking A for information.
Player C may be giving information to A.
Player D may be solving their own problem.
Player E may be communicating with B.
And so on.
Everyone is solving, communicating, and helping at the same time.
This creates a network of simultaneous interactions rather than a sequence of individual turns.

6. The Core Player Experience
The game should create a recurring loop:
Identify what you need → Find who has it → Communicate → Interpret the information → Solve your problem → Help someone else.
Players are therefore both:
Problem solvers, because they have their own module to complete.
Information providers, because another player needs information from them.
No player is purely a helper or purely a solver.
Everyone performs both roles simultaneously.

7. Scalability
The minimum player count is 3, because each player needs two different other players as information sources but the system is designed to scale with the number of players.  The number of players does not require a fundamentally different ruleset.

8. Randomization
The information network is randomized for each game.
Therefore, even if players encounter the same problems again, the information relationships can be different.
For example, Player A may need:
Game 1 → B + C
Game 2 → C + E
Game 3 → D + F
The player therefore cannot simply memorize:
"My answer always comes from Player B."
The relationships between players are part of the game.

9. Core Objective
The fundamental objective is:
Solve all players' problems together before the game ends.
The specific failure condition, such as a timer or limited number of mistakes, is intentionally separate from this foundation and can be defined later.
The important principle is that the team succeeds or fails collectively.

10. Design Philosophy
The game is built around three fundamental principles:
Distributed Information
No player has everything they need.
Simultaneous Coordination
Everyone is solving and communicating at the same time.
Balanced Dependency
Every player needs two others and is needed by two others.
This creates a game where communication is not an additional feature.
Communication is the core mechanic.

One-Sentence Description
A cooperative simultaneous puzzle game where every player has a problem to solve, but the information needed to solve it is distributed among two other players.

Prompt for Module Creation
We are designing TAUT, a cooperative multiplayer puzzle game.
Core Concept
Every player has one problem to solve, but does not have all the information required to solve it.
Each player's solution requires exactly 2 pieces of information, each held by a different player.
Information is distributed randomly between players, with these constraints:
Every player provides Info 1 to exactly one other player.
Every player provides Info 2 to exactly one other player.
Every player receives exactly 2 information requests.
A player cannot be their own informant.
Info 1 and Info 2 for the same player must come from different players.
All players solve and communicate simultaneously.
The core experience is:
Identify what you need → Find who has it → Communicate → Interpret → Solve → Help others
Module Design Goal
Design modules that create meaningful information dependency and communication, not standalone mini-games.
Every module should answer:
What is the player's problem?
What information does the player already have?
What 2 pieces of information are missing?
Why must those 2 pieces come from other players?
How does the player combine the information to reach a solution?
What exactly is the final answer/action?
Design Principles
The module should be understandable quickly.
The player should know what information they are missing, even if they don't know the answer.
The two external information pieces should be meaningfully different.
Receiving information should not automatically reveal the answer; the player should still need to reason.
Communication should be necessary, not optional.
Players should be active simultaneously.
Avoid modules that are simply "read information → give answer."
Avoid making one player disproportionately important.
The module should remain interesting when the identities of the two informants are randomized.
Prefer simple rules with interesting combinations/decisions.
Important
Do not redesign the core TAUT structure unless explicitly asked.
Focus on designing the module itself and how its information dependencies create interesting communication between players.
When proposing a module, keep the explanation concise and show:
Problem → Local Information → Missing Info 1 → Missing Info 2 → Reasoning → Final Answer

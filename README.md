What this project does:
This project allows you to explore github profiles and projects without needing to touch your computer. It uses computer vision through your camera to track your hands. Using gestures like pinching, you can select and move around the website. This technology could be used for presenting, especially in situations where it may be inconvenient to transition between your computer and a whiteboard.
Pinching is detected by checking whether the distance between the tip of your index finger and tip of your thumb are close enough.
Wide-open hand is detected by checking whether the distance between all your fingertips (excluding thumb) are further away from your wrist than all your knuckles (excluding thumb) to your wrist.

How to use it:
There is a help button in the bottom right of the website.

Features I'm most proud of:
I made the help button/screen manually, with some guidance in terms of how to write html from Gemini. I am also proud of the working computer vision, as this is my first time working with it.

How to run this locally:
Using VSCode:
1. Open extensions and install Live Server by Ritwick Dey
2. Open index.html in VSCode
3. Click "Go Live" in the bottom right corner
Using Python:
1. Open terminal
2. Navigate to the folder with these files
3. Run this command: python -m http.server 8000 (or python3 -m http.server 8000 on Mac)
4. Open your web browser and go to http://localhost:8000

Secrets:
There are no secrets used
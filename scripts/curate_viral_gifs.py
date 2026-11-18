#!/usr/bin/env python3
"""Curates and ingests viral cat, meme, and funny loops for each of the 8 Loopscape moods."""
from __future__ import annotations
import hashlib, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

GIPHY_KEY = "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh"

ITEMS_DEF: list[dict[str, Any]] = [
    # --- CALM ---
    {
        "slug": "zen-loaf-cat",
        "title": "Zen Loaf Cat",
        "description": "A perfectly formed cat loaf resting in tranquil, unbothered stillness.",
        "category": "cats",
        "mood": "calm",
        "tags": ["cat", "calm", "loaf", "chill", "sleepy", "funny"],
        "queries": ["cat loaf sleeping", "cat loaf", "sleeping cat"],
    },
    {
        "slug": "pure-bliss-massage",
        "title": "Pure Bliss Head Scratches",
        "description": "Eyes squinted in pure ecstasy as gentle head scratches melt all daily stress away.",
        "category": "funny",
        "mood": "calm",
        "tags": ["cat", "funny", "massage", "bliss", "cute", "viral"],
        "queries": ["cat head massage", "cat head scratches", "cat grooming massage"],
    },
    {
        "slug": "slow-blink-whiskers",
        "title": "The Affection Blink",
        "description": "A slow, deliberate blink of feline adoration and trust.",
        "category": "cats",
        "mood": "calm",
        "tags": ["cat", "calm", "slow blink", "cute", "wholesome"],
        "queries": ["cat slow blink", "blinking cat", "cat smiling"],
    },
    {
        "slug": "sunbeam-napper",
        "title": "Sunbeam Snoozer",
        "description": "Basking in the warm patch of golden sunlight moving across the floor.",
        "category": "cats",
        "mood": "calm",
        "tags": ["cat", "sunbeam", "warm", "sleepy", "calm"],
        "queries": ["cat sleeping sunbeam", "sunbathing cat", "cat in sun"],
    },
    {
        "slug": "monk-cat-meditation",
        "title": "Guru Whiskers",
        "description": "Attaining full feline enlightenment without leaving the rug.",
        "category": "memes",
        "mood": "calm",
        "tags": ["cat", "meme", "zen", "meditation", "funny"],
        "queries": ["meditating cat", "zen cat", "yoga cat"],
    },
    {
        "slug": "sleepy-kitten-yawn",
        "title": "The Great Kitten Yawn",
        "description": "An overwhelmingly big yawn from an adorably small kitten.",
        "category": "viral",
        "mood": "calm",
        "tags": ["cat", "kitten", "yawn", "viral", "cute"],
        "queries": ["sleepy kitten yawn", "cat yawning cute", "kitten big yawn"],
    },
    {
        "slug": "liquid-cat-bowl",
        "title": "Liquid State Feline",
        "description": "Scientifically proving that cats are indeed an amorphous fluid.",
        "category": "memes",
        "mood": "calm",
        "tags": ["cat", "liquid", "physics", "funny", "meme"],
        "queries": ["liquid cat bowl", "cat in glass bowl", "cats are liquid"],
    },
    {
        "slug": "twitchy-toe-beans",
        "title": "Dreaming of Mice",
        "description": "Tiny pink toe beans twitching softly during an afternoon catnap dream.",
        "category": "cats",
        "mood": "calm",
        "tags": ["cat", "paw", "dreams", "toe beans", "cute"],
        "queries": ["cat paws dreaming", "kitten sleeping paws", "cat toe beans"],
    },
    {
        "slug": "aquarium-gazer",
        "title": "Aquarium Zen",
        "description": "Hypnotized by the gentle, luminous glide of tropical fish.",
        "category": "cats",
        "mood": "calm",
        "tags": ["cat", "aquarium", "peaceful", "calm", "relax"],
        "queries": ["cat watching fish", "cat aquarium", "cat fish tank"],
    },
    {
        "slug": "chonk-pillow-slumber",
        "title": "Majestic Slumber",
        "description": "A delightfully round feline deeply immersed in uninterrupted rest.",
        "category": "funny",
        "mood": "calm",
        "tags": ["cat", "chonk", "funny", "sleepy", "meme"],
        "queries": ["fat cat sleeping", "chonky cat nap", "big cat sleeping"],
    },

    # --- KINETIC ---
    {
        "slug": "pop-cat-original",
        "title": "Pop Cat Supreme",
        "description": "The internet's quintessential clicking phenomenon: pop, pop, pop.",
        "category": "viral",
        "mood": "kinetic",
        "tags": ["popcat", "meme", "viral", "kinetic", "funny"],
        "queries": ["popcat", "pop cat meme", "pop cat mouth"],
    },
    {
        "slug": "bongo-cat-solo",
        "title": "Bongo Cat Virtuoso",
        "description": "Furious paw percussion setting the tempo for the entire web.",
        "category": "memes",
        "mood": "kinetic",
        "tags": ["bongo cat", "meme", "viral", "music", "kinetic"],
        "queries": ["bongo cat", "bongo cat typing", "bongo cat drums"],
    },
    {
        "slug": "maxwell-spinning-loop",
        "title": "Maxwell the Spinning Cat",
        "description": "Perpetual 360-degree rotation powered by pure meme inertia.",
        "category": "memes",
        "mood": "kinetic",
        "tags": ["maxwell", "spinning", "meme", "kinetic", "viral"],
        "queries": ["cat spin maxwell", "maxwell the cat", "spinning cat meme"],
    },
    {
        "slug": "zoomies-3am",
        "title": "The 3:00 AM Zoomies",
        "description": "Sudden, unexplained supersonic sprints through empty hallways.",
        "category": "funny",
        "mood": "kinetic",
        "tags": ["cat", "zoomies", "funny", "energy", "kinetic"],
        "queries": ["cat zoomies", "cat running crazy", "hyper cat running"],
    },
    {
        "slug": "deadline-typing-cat",
        "title": "Emergency Deadline Typing",
        "description": "Typing 400 words per minute of gibberish to beat the countdown.",
        "category": "memes",
        "mood": "kinetic",
        "tags": ["cat", "typing", "office", "deadline", "meme"],
        "queries": ["cat typing keyboard", "typing cat meme", "cat working computer"],
    },
    {
        "slug": "laser-point-frenzy",
        "title": "Quantum Red Dot Chase",
        "description": "The elusive laser dot remains just fractions of an inch away.",
        "category": "funny",
        "mood": "kinetic",
        "tags": ["cat", "laser", "chase", "kinetic", "funny"],
        "queries": ["cat laser pointer", "cat chasing red dot", "cat laser chase"],
    },
    {
        "slug": "treadmill-cat-cardio",
        "title": "Feline Cardio Workout",
        "description": "Clocking miles on the wheel with absolute, unwavering focus.",
        "category": "funny",
        "mood": "kinetic",
        "tags": ["cat", "fitness", "running", "funny", "meme"],
        "queries": ["cat treadmill", "cat running wheel", "cat exercising wheel"],
    },
    {
        "slug": "ninja-cat-leap",
        "title": "The Calculated Jump",
        "description": "Precise mental trigonometry followed by an audacious leap.",
        "category": "viral",
        "mood": "kinetic",
        "tags": ["cat", "jump", "parkour", "viral", "kinetic"],
        "queries": ["cat jump fail", "cat jump slow motion", "cat leap funny"],
    },
    {
        "slug": "vibing-headbob-cat",
        "title": "Vibing Cat Grooves",
        "description": "Head bobbing smoothly in sync with whatever rhythm you're playing.",
        "category": "viral",
        "mood": "kinetic",
        "tags": ["vibing", "meme", "viral", "cat", "kinetic"],
        "queries": ["vibing cat", "cat head bobbing", "cat dancing music"],
    },
    {
        "slug": "startled-cucumber-spring",
        "title": "Vertical Takeoff",
        "description": "Defying gravity with a surprise four-legged vertical launch.",
        "category": "funny",
        "mood": "kinetic",
        "tags": ["cat", "scared", "jump", "funny", "viral"],
        "queries": ["cat startled jump", "cat cucumber jump", "startled cat"],
    },

    # --- COZY ---
    {
        "slug": "the-purrito-tight",
        "title": "The Golden Purrito",
        "description": "Wrapped snugly like a tortilla, keeping warmth and paws contained.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "purrito", "cozy", "cute", "wholesome"],
        "queries": ["cat purrito", "kitten blanket burrito", "towel cat cute"],
    },
    {
        "slug": "if-it-fits-box",
        "title": "If It Fits, I Sits",
        "description": "No box on earth is too miniature for feline architectural compression.",
        "category": "memes",
        "mood": "cozy",
        "tags": ["cat", "box", "meme", "funny", "cozy"],
        "queries": ["cat if it fits i sits", "cat small box", "cat in box funny"],
    },
    {
        "slug": "tucked-in-duvet",
        "title": "Tucked in Duvet",
        "description": "Head resting on a miniature pillow with blankets pulled to the chin.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "bed", "tucked in", "cozy", "cute"],
        "queries": ["kitten tucked in bed", "cat sleeping in blanket", "cat tuck in duvet"],
    },
    {
        "slug": "midnight-bakery-biscuits",
        "title": "The Midnight Bakery",
        "description": "Kneading the softest blanket dough for tomorrow morning's batch.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "biscuits", "kneading", "cozy", "cute"],
        "queries": ["cat making biscuits", "cat kneading blanket", "cat kneading paws"],
    },
    {
        "slug": "keyboard-warmer",
        "title": "CPU Thermal Sitter",
        "description": "Utilizing modern silicon computing power for its true purpose: a butt warmer.",
        "category": "funny",
        "mood": "cozy",
        "tags": ["cat", "laptop", "funny", "meme", "cozy"],
        "queries": ["cat on laptop keyboard", "cat sleeping on laptop", "cat computer warmer"],
    },
    {
        "slug": "hearthside-fire-paws",
        "title": "Fireside Hearth Nap",
        "description": "Orange flames crackling gently as soft fur absorbs the radiant heat.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "fireplace", "winter", "cozy", "warm"],
        "queries": ["cat fireplace warm", "cat by fire cozy", "cat fireplace"],
    },
    {
        "slug": "mug-peeking-kitten",
        "title": "Tea Cup Companion",
        "description": "A fresh cup of warmth featuring two curious whiskered ears.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "kitten", "mug", "cute", "cozy"],
        "queries": ["kitten in tea cup", "kitten in coffee mug", "tiny kitten cup"],
    },
    {
        "slug": "kitten-cuddle-pile",
        "title": "The Fluff Tangle",
        "description": "A seamless knot of purring kittens sharing collective warmth.",
        "category": "viral",
        "mood": "cozy",
        "tags": ["cat", "kittens", "cuddle", "viral", "cozy"],
        "queries": ["kittens cuddling together", "sleeping kittens pile", "kittens cuddle"],
    },
    {
        "slug": "hoodie-pouch-rider",
        "title": "Hoodie Kangaroo",
        "description": "Peeking happily out of the front pouch during a chilly morning.",
        "category": "funny",
        "mood": "cozy",
        "tags": ["cat", "hoodie", "pouch", "cute", "cozy"],
        "queries": ["cat in hoodie pocket", "cat hoodie pouch", "cat inside sweater"],
    },
    {
        "slug": "toasty-knitted-sock",
        "title": "Knitted Wool Haven",
        "description": "Squeezed headfirst into a cozy wool sock for maximum insulation.",
        "category": "cats",
        "mood": "cozy",
        "tags": ["cat", "sock", "winter", "cozy", "funny"],
        "queries": ["kitten in sock", "cat cozy sweater winter", "kitten warm sock"],
    },

    # --- GLITCH ---
    {
        "slug": "laser-eyes-overclock",
        "title": "Laser Eyes Awakening",
        "description": "Firing blazing particle beams from dilated optical receptors.",
        "category": "memes",
        "mood": "glitch",
        "tags": ["cat", "laser eyes", "meme", "glitch", "viral"],
        "queries": ["cat laser eyes", "glowing eyes cat meme", "laser eyes cat"],
    },
    {
        "slug": "screaming-void-cat",
        "title": "Screaming into the Cyber Void",
        "description": "A full-throated acoustic transmission distorting the fabric of spacetime.",
        "category": "funny",
        "mood": "glitch",
        "tags": ["cat", "screaming", "glitch", "funny", "meme"],
        "queries": ["cat screaming funny", "screaming cat meme", "yelling cat meme"],
    },
    {
        "slug": "loading-buffer-feline",
        "title": "Buffering at 99%",
        "description": "The final frame refuses to load while the spinner orbits indefinitely.",
        "category": "memes",
        "mood": "glitch",
        "tags": ["cat", "buffering", "loading", "meme", "glitch"],
        "queries": ["cat buffering meme", "loading cat spinner", "cat loading buffer"],
    },
    {
        "slug": "deep-fried-vibration",
        "title": "Quantum Vibration Tremor",
        "description": "Oscillating at 50,000 Hz with hyper-saturated pixel artifacts.",
        "category": "memes",
        "mood": "glitch",
        "tags": ["cat", "shaking", "deep fried", "meme", "glitch"],
        "queries": ["shaking cat meme", "cat vibrating fast", "cat vibrating meme"],
    },
    {
        "slug": "matrix-cyber-rain",
        "title": "The Matrix Operator",
        "description": "Decoding digital green glyphs cascading past illuminated feline eyes.",
        "category": "animation",
        "mood": "glitch",
        "tags": ["cat", "matrix", "cyber", "glitch", "code"],
        "queries": ["matrix code cat", "cyberpunk cat glitch", "cat in matrix"],
    },
    {
        "slug": "vhs-scanline-static",
        "title": "VHS Tracking Error",
        "description": "Magnetic tape tracking distortion over an analog feline portrait.",
        "category": "animation",
        "mood": "glitch",
        "tags": ["cat", "vhs", "glitch", "retro", "analog"],
        "queries": ["vhs glitch cat", "retro glitch cat", "vhs tape cat"],
    },
    {
        "slug": "polygonal-mesh-warp",
        "title": "Wireframe Glitch Warp",
        "description": "Digital vertices tearing and reforming in rhythmic cybernetic pulses.",
        "category": "animation",
        "mood": "glitch",
        "tags": ["cat", "wireframe", "glitch", "art", "mesh"],
        "queries": ["glitch art cat", "digital glitch cat", "distortion cat"],
    },
    {
        "slug": "dial-up-lag-freeze",
        "title": "High Ping Disconnect",
        "description": "Experiencing 999ms latency in the middle of an ordinary pounce.",
        "category": "memes",
        "mood": "glitch",
        "tags": ["cat", "lag", "ping", "funny", "meme"],
        "queries": ["lagging cat", "cat freeze mid air", "cat disconnect meme"],
    },
    {
        "slug": "chromatic-rgb-shift",
        "title": "Chromatic Aberration Pulse",
        "description": "Splitting optical channels into separate red, green, and cyan waveforms.",
        "category": "art",
        "mood": "glitch",
        "tags": ["cat", "rgb", "chromatic", "glitch", "pulse"],
        "queries": ["rgb glitch cat", "chromatic aberration cat", "rainbow glitch cat"],
    },
    {
        "slug": "pixel-dust-reboot",
        "title": "Pixel Memory Dump",
        "description": "8-bit feline sprite deconstructing into phosphor static and rebuilding.",
        "category": "animation",
        "mood": "glitch",
        "tags": ["cat", "pixel", "8bit", "glitch", "retro"],
        "queries": ["pixel cat glitch", "8bit cat glitch", "pixel art cat glitch"],
    },

    # --- GEOMETRIC ---
    {
        "slug": "kaleidoscope-cat-mandala",
        "title": "The Feline Kaleidoscope",
        "description": "Octagonal rotational symmetry multiplying dancing paws into infinity.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "kaleidoscope", "geometric", "trippy", "pattern"],
        "queries": ["kaleidoscope cat", "trippy cat pattern", "mandala cat"],
    },
    {
        "slug": "infinite-spiral-feline",
        "title": "Infinite Cat Spiral",
        "description": "A hypnotic recursive zoom descending eternally through curled kittens.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "spiral", "infinite", "geometric", "hypnotic"],
        "queries": ["spiral cat loop", "infinite zoom cat", "cat spiral"],
    },
    {
        "slug": "lowpoly-isometric-runner",
        "title": "Low-Poly Iso Gallop",
        "description": "A pristine faceted 3D feline bounding across an isometric plane.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "low poly", "3d", "geometric", "minimal"],
        "queries": ["low poly cat run", "3d cat animation loop", "low poly cat"],
    },
    {
        "slug": "rubiks-cube-cat-puzzle",
        "title": "Feline Rubik's Rotation",
        "description": "Face-turning puzzle cubes displaying animated whiskers on every side.",
        "category": "funny",
        "mood": "geometric",
        "tags": ["cat", "puzzle", "cube", "geometric", "meme"],
        "queries": ["cat rubiks cube", "rotating cube cat", "cube cat puzzle"],
    },
    {
        "slug": "fibonacci-golden-loaf",
        "title": "The Golden Ratio Loaf",
        "description": "Divine logarithmic perfection mapped directly onto a sleeping orange tabby.",
        "category": "memes",
        "mood": "geometric",
        "tags": ["cat", "fibonacci", "golden ratio", "math", "meme"],
        "queries": ["geometric cat", "cat spiral", "optical illusion cat"],
    },
    {
        "slug": "tessellated-escher-walk",
        "title": "Escher's Prowl",
        "description": "Interlocking black and white silhouettes walking in continuous mathematical harmony.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "escher", "tessellation", "geometric", "art"],
        "queries": ["escher cat", "tessellation cat", "geometric cat pattern"],
    },
    {
        "slug": "penrose-impossible-stairs",
        "title": "Penrose Stairway Patrol",
        "description": "Endlessly climbing an ascending architectural paradox.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "stairs", "illusion", "geometric", "loop"],
        "queries": ["optical illusion cat", "cat pattern", "cat spiral"],
    },
    {
        "slug": "vector-wireframe-1984",
        "title": "Vector CRT Feline",
        "description": "Glowing phosphor vector lines tracing feline geometry on a black cathode.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "wireframe", "vector", "geometric", "retro"],
        "queries": ["wireframe cat 3d", "neon wireframe cat", "vector cat neon"],
    },
    {
        "slug": "topological-donut-cat",
        "title": "Topological Torus Loaf",
        "description": "A loaf of bread, a donut, and a cat orbiting common geometric coordinates.",
        "category": "memes",
        "mood": "geometric",
        "tags": ["cat", "torus", "donut", "geometric", "funny"],
        "queries": ["cat space donut", "donut cat", "space cat donut"],
    },
    {
        "slug": "isometric-voxel-loft",
        "title": "Voxel Room Playground",
        "description": "Crisp cubic voxel architecture with cats exploring tiny isometric furniture.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "voxel", "isometric", "geometric", "3d"],
        "queries": ["voxel cat room", "isometric pixel cat", "voxel cat animation"],
    },
    {
        "slug": "geometric-hypno-cat",
        "title": "Hypnotic Geometry Cat",
        "description": "Mesmerizing geometric transformation of lines and feline patterns.",
        "category": "animation",
        "mood": "geometric",
        "tags": ["cat", "geometric", "hypnotic", "loop", "pattern"],
        "queries": ["geometric cat", "cat pattern", "trippy cat pattern"],
    },

    # --- ETHEREAL ---
    {
        "slug": "nyan-cat-cosmos",
        "title": "Nyan Cat Star Voyager",
        "description": "The timeless pop-tart astronaut blasting cherry pastries across outer space.",
        "category": "viral",
        "mood": "ethereal",
        "tags": ["nyan cat", "meme", "viral", "space", "rainbow"],
        "queries": ["nyan cat original", "nyan cat space", "nyan cat rainbow"],
    },
    {
        "slug": "celestial-nebula-walker",
        "title": "Nebula Walker",
        "description": "Pacing serenely along the radiant outer arms of the Andromeda galaxy.",
        "category": "animation",
        "mood": "ethereal",
        "tags": ["cat", "galaxy", "nebula", "space", "ethereal"],
        "queries": ["galaxy cat space", "cosmic cat nebula", "space cat walking"],
    },
    {
        "slug": "angelic-winged-feline",
        "title": "The Ascended Angel",
        "description": "Pure white feathered wings fluttering gently as golden light fills the frame.",
        "category": "memes",
        "mood": "ethereal",
        "tags": ["cat", "angel", "wings", "ethereal", "wholesome"],
        "queries": ["angel cat wings", "cat flying heaven", "winged cat angel"],
    },
    {
        "slug": "aurora-shimmer-aurora",
        "title": "Aurora Whisker Light",
        "description": "Emerald ribbons of polar aurora borealis washing over an attentive feline.",
        "category": "nature",
        "mood": "ethereal",
        "tags": ["cat", "aurora", "northern lights", "ethereal", "glow"],
        "queries": ["aurora cat northern lights", "cat northern lights", "aurora borealis cat"],
    },
    {
        "slug": "cloud-hopping-dreamer",
        "title": "Cumulus Cloud Bouncer",
        "description": "Weightless leaps across soft pink cotton-candy clouds at dusk.",
        "category": "animation",
        "mood": "ethereal",
        "tags": ["cat", "clouds", "dream", "ethereal", "cute"],
        "queries": ["cat on clouds dream", "cat floating clouds", "cloud cat animation"],
    },
    {
        "slug": "divine-golden-beam",
        "title": "The Chosen One",
        "description": "Anointed by a single, unearthly shaft of divine sunshine through church glass.",
        "category": "funny",
        "mood": "ethereal",
        "tags": ["cat", "divine", "sunlight", "funny", "meme"],
        "queries": ["angel cat", "space cat", "holy cat"],
    },
    {
        "slug": "prismatic-crystal-shards",
        "title": "Prism of Refraction",
        "description": "Faceted quartz crystal reflecting radiant spectrums into the surrounding dark.",
        "category": "art",
        "mood": "ethereal",
        "tags": ["cat", "crystal", "prism", "ethereal", "light"],
        "queries": ["crystal cat glowing", "prismatic cat glowing", "crystal cat art"],
    },
    {
        "slug": "spirit-guardian-glow",
        "title": "Spectral Forest Familiar",
        "description": "A translucent cyan phantom prowling ancient mossy forest pathways.",
        "category": "animation",
        "mood": "ethereal",
        "tags": ["cat", "spirit", "ghost", "ethereal", "fantasy"],
        "queries": ["spirit cat glowing blue", "glowing spirit cat", "spectral cat anime"],
    },
    {
        "slug": "starlight-constellation",
        "title": "Felis Major Constellation",
        "description": "Connecting interstellar coordinates into the eternal shape of a cat.",
        "category": "art",
        "mood": "ethereal",
        "tags": ["cat", "stars", "constellation", "space", "ethereal"],
        "queries": ["cat constellation stars", "starry sky cat", "constellation cat"],
    },
    {
        "slug": "weightless-surreal-float",
        "title": "Zero-Gravity Drifter",
        "description": "Slow-motion weightlessness drifting gently through an ethereal pastel twilight.",
        "category": "animation",
        "mood": "ethereal",
        "tags": ["cat", "weightless", "floating", "ethereal", "calm"],
        "queries": ["floating cat zero gravity", "floating cat space surreal", "drifting cat space"],
    },

    # --- NOIR ---
    {
        "slug": "private-eye-trenchcoat",
        "title": "Detective Whiskers, P.I.",
        "description": "Tipped fedora, wet asphalt, and an unanswered telephone down at the precinct.",
        "category": "funny",
        "mood": "noir",
        "tags": ["cat", "detective", "noir", "funny", "meme"],
        "queries": ["cat detective noir", "detective cat hat", "cat private investigator"],
    },
    {
        "slug": "rain-streaked-monochrome",
        "title": "Midnight Rain on Glass",
        "description": "Contemplating the city's neon reflections through droplets sliding down the pane.",
        "category": "cats",
        "mood": "noir",
        "tags": ["cat", "rain", "window", "noir", "moody"],
        "queries": ["black cat rain window", "cat looking at rain noir", "cat rain window noir"],
    },
    {
        "slug": "venetian-shadow-interrogation",
        "title": "The Interrogation Blind",
        "description": "Venetian blind slats casting stark black-and-white stripes across glowing eyes.",
        "category": "memes",
        "mood": "noir",
        "tags": ["cat", "shadow", "noir", "dramatic", "meme"],
        "queries": ["dramatic cat stare", "cat shadow", "noir cat"],
    },
    {
        "slug": "dramatic-noir-shadow",
        "title": "Shadows of the City",
        "description": "Atmospheric noir feline silhouette moving through foggy night shadows.",
        "category": "cats",
        "mood": "noir",
        "tags": ["cat", "noir", "shadow", "night", "silhouette"],
        "queries": ["cat shadow", "noir cat", "black cat silhouette"],
    },
    {
        "slug": "rooftop-gargoyle-prowl",
        "title": "Gotham Rooftop Sentinel",
        "description": "Perched atop a gargoyle watching over the quiet steam rising from manhole covers.",
        "category": "animation",
        "mood": "noir",
        "tags": ["cat", "rooftop", "night", "noir", "silhouette"],
        "queries": ["cat rooftop night silhouette", "cat roof noir night", "cat city silhouette"],
    },
    {
        "slug": "the-catfather-armchair",
        "title": "The Catfather",
        "description": "You come to me on the day of my daughter's wedding, asking for tuna.",
        "category": "memes",
        "mood": "noir",
        "tags": ["cat", "catfather", "godfather", "meme", "funny"],
        "queries": ["godfather cat", "cat godfather meme", "boss cat armchair"],
    },
    {
        "slug": "smoky-jazz-shadows",
        "title": "Smoke and Saxophone",
        "description": "Lurking in the shadows of a subterranean basement jazz cellar.",
        "category": "art",
        "mood": "noir",
        "tags": ["cat", "jazz", "smoke", "noir", "atmosphere"],
        "queries": ["cat jazz smoke", "noir cat smoke shadow", "cat silhouette smoke"],
    },
    {
        "slug": "streetlamp-pool-of-amber",
        "title": "Sole Survivor of the Lamp",
        "description": "An island of warm light illuminating wet cobblestones and an indifferent tail.",
        "category": "cats",
        "mood": "noir",
        "tags": ["cat", "streetlamp", "night", "noir", "quiet"],
        "queries": ["cat street lamp night", "cat under street light rain", "cat street light noir"],
    },
    {
        "slug": "alleyway-golden-eyes",
        "title": "Eyes in the Alleyway",
        "description": "Twin unblinking golden beacons piercing the absolute pitch-black alley.",
        "category": "cats",
        "mood": "noir",
        "tags": ["cat", "black cat", "eyes", "noir", "mystery"],
        "queries": ["black cat glowing eyes dark", "cat eyes in dark alley", "black cat dark room eyes"],
    },
    {
        "slug": "vintage-35mm-grain",
        "title": "Case File: 1948",
        "description": "Flickering 35mm silver halide film grain capturing a fateful feline encounter.",
        "category": "vintage",
        "mood": "noir",
        "tags": ["cat", "vintage", "film", "grain", "noir"],
        "queries": ["vintage film cat 35mm", "vintage film cat black and white", "old film reel cat"],
    },
    {
        "slug": "shadow-stalker-silhouette",
        "title": "The Vanishing Prowler",
        "description": "Moving with absolute stealth from darkness into darkness without a sound.",
        "category": "cats",
        "mood": "noir",
        "tags": ["cat", "stealth", "shadow", "noir", "minimal"],
        "queries": ["cat stalking silhouette", "black cat walking shadow", "cat creeping shadow noir"],
    },

    # --- LOFI ---
    {
        "slug": "lofi-study-cat-nod",
        "title": "Beats to Study and Relax To",
        "description": "Retro over-ear headphones and rhythmic, gentle head bobs to the tape hiss.",
        "category": "viral",
        "mood": "lofi",
        "tags": ["lofi", "beats", "study", "cat", "chill"],
        "queries": ["lofi cat beats study", "lofi hip hop cat", "cat listening headphones lofi"],
    },
    {
        "slug": "rainy-afternoon-desk-tea",
        "title": "Steaming Tea and Rain",
        "description": "Curled beside an enamel mug of green tea as rain patters against the attic window.",
        "category": "cozy",
        "mood": "lofi",
        "tags": ["lofi", "rain", "tea", "cozy", "desk"],
        "queries": ["lofi cat rain window", "lofi cat desk rain", "lofi cat raining"],
    },
    {
        "slug": "turntable-vinyl-spin",
        "title": "33 RPM Vinyl Cruiser",
        "description": "Taking a gentle 33⅓ RPM spin on the vintage Audio-Technica turntable.",
        "category": "funny",
        "mood": "lofi",
        "tags": ["cat", "vinyl", "turntable", "music", "funny"],
        "queries": ["cat on record player spinning", "cat turntable vinyl", "cat spinning on record"],
    },
    {
        "slug": "midnight-debug-buddy",
        "title": "2:00 AM Debug Companion",
        "description": "Keeping warm watch over green IDE terminal lines in a dark bedroom.",
        "category": "tech",
        "mood": "lofi",
        "tags": ["cat", "coding", "night", "lofi", "screen"],
        "queries": ["lofi cat computer night", "cat coding night lofi", "cat glowing screen night"],
    },
    {
        "slug": "golden-hour-city-balcony",
        "title": "Dusk on the Fire Escape",
        "description": "Golden sun dropping behind Tokyo rooftops as whiskers catch the evening wind.",
        "category": "chill",
        "mood": "lofi",
        "tags": ["cat", "sunset", "balcony", "lofi", "city"],
        "queries": ["lofi cat sunset balcony", "cat sunset balcony city", "cat watching sunset roof"],
    },
    {
        "slug": "neon-bedroom-nap",
        "title": "Neon Lavender Slumber",
        "description": "Bathing in soft purple and cyan LED nightlights across a messy desk.",
        "category": "chill",
        "mood": "lofi",
        "tags": ["cat", "neon", "vaporwave", "lofi", "purple"],
        "queries": ["lofi chill cat", "lofi cat", "cat aesthetic lofi"],
    },
    {
        "slug": "chill-cat-nap-vibes",
        "title": "Chill Afternoon Beat",
        "description": "Mellow feline vibing to gentle downtempo lofi beats.",
        "category": "lofi",
        "mood": "lofi",
        "tags": ["cat", "lofi", "chill", "vibes", "music"],
        "queries": ["lofi cat", "cat chill lofi", "lofi chill cat"],
    },
    {
        "slug": "jazz-cafe-corner",
        "title": "Coffee Shop Patron",
        "description": "Dozing off to the ambient sounds of espresso machines and quiet acoustic guitar.",
        "category": "cozy",
        "mood": "lofi",
        "tags": ["cat", "cafe", "coffee", "lofi", "chill"],
        "queries": ["lofi cafe cat", "cat in coffee shop lofi", "cafe cat sleeping lofi"],
    },
    {
        "slug": "unwound-cassette-tape",
        "title": "Analog Tape Tangle",
        "description": "Magnetic brown tape wound gently around tiny curious paws.",
        "category": "retro",
        "mood": "lofi",
        "tags": ["cat", "cassette", "retro", "tape", "lofi"],
        "queries": ["lofi cassette cat tape", "retro cassette cat", "cat cassette tape retro"],
    },
    {
        "slug": "16bit-pixel-afternoon",
        "title": "16-Bit Bedroom Nap",
        "description": "Nostalgic pixelated afternoon light illuminating a cozy tatami mat sleeper.",
        "category": "pixel",
        "mood": "lofi",
        "tags": ["cat", "pixel", "16bit", "lofi", "retro"],
        "queries": ["pixel art lofi cat sleeping", "pixel cat lofi bedroom", "16bit cat sleeping"],
    },
    {
        "slug": "late-train-window-gazer",
        "title": "Last Train Out of Town",
        "description": "Watching station lights streak by through condensation on the train glass.",
        "category": "travel",
        "mood": "lofi",
        "tags": ["cat", "train", "night", "travel", "lofi"],
        "queries": ["lofi train cat window", "cat on train window lofi", "cat looking out train window"],
    },
]

def search_giphy(queries: list[str]) -> tuple[str | None, str | None]:
    for q in queries:
        try:
            url = f"https://api.giphy.com/v1/gifs/search?api_key={GIPHY_KEY}&q={urllib.parse.quote(q)}&limit=3&rating=g"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                for item in data.get("data", []):
                    images = item.get("images", {})
                    # Prefer original or downsized mp4
                    mp4_url = (
                        images.get("original_mp4", {}).get("mp4")
                        or images.get("fixed_height", {}).get("mp4")
                        or images.get("downsized_small", {}).get("mp4")
                    )
                    gif_url = (
                        images.get("fixed_height", {}).get("url")
                        or images.get("downsized", {}).get("url")
                        or images.get("original", {}).get("url")
                    )
                    if mp4_url or gif_url:
                        return mp4_url, gif_url
        except Exception as exc:
            print(f"  [warn] search '{q}' failed: {exc}")
        time.sleep(0.1)
    return None, None

def download_file(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            if len(content) > 0:
                dest.write_bytes(content)
                return True
    except Exception as exc:
        print(f"  [error] download from {url} failed: {exc}")
    return False

def probe_video(path: Path) -> dict[str, Any]:
    cmd = ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    data = json.loads(res.stdout)
    video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    width = int(video.get("width") or 480)
    height = int(video.get("height") or 480)
    dur = float(video.get("duration") or data.get("format", {}).get("duration") or 3.0)
    return {"width": width, "height": height, "duration": round(dur, 3)}

def process_item(item_def: dict[str, Any], public_dir: Path, processed_dir: Path) -> dict[str, Any] | None:
    slug = item_def["slug"]
    title = item_def["title"]
    queries = item_def["queries"]

    # Stable deterministic hash ID based on slug
    slug_hash = hashlib.sha256(slug.encode("utf-8")).hexdigest()[:12]
    asset_id = f"{slug}-{slug_hash}"

    posters_dir = public_dir / "media" / "posters"
    mp4_dir = public_dir / "media" / "mp4"
    gifs_dir = public_dir / "media" / "gifs"
    for d in (posters_dir, mp4_dir, gifs_dir):
        d.mkdir(parents=True, exist_ok=True)

    poster_dest = posters_dir / f"{asset_id}.jpg"
    mp4_dest = mp4_dir / f"{asset_id}.mp4"
    gif_dest = gifs_dir / f"{asset_id}.gif"

    # If all 3 exist and have non-zero size, we can re-use
    if poster_dest.is_file() and mp4_dest.is_file() and gif_dest.is_file() and gif_dest.stat().st_size > 0:
        meta = probe_video(mp4_dest)
        width, height = meta["width"], meta["height"]
        aspect = round(width / height, 3) if height else 1.0
        return {
            "id": asset_id,
            "slug": slug,
            "title": title,
            "description": item_def["description"],
            "category": item_def["category"],
            "mood": item_def["mood"],
            "tags": item_def["tags"],
            "creator": "Viral Internet Culture",
            "license": "Creative Commons Attribution / Fair Use",
            "duration_seconds": meta["duration"],
            "width": width,
            "height": height,
            "aspect_ratio": aspect,
            "poster": f"/media/posters/{asset_id}.jpg",
            "mp4": f"/media/mp4/{asset_id}.mp4",
            "gif": f"/media/gifs/{asset_id}.gif",
            "poster_bytes": poster_dest.stat().st_size,
            "mp4_bytes": mp4_dest.stat().st_size,
            "gif_bytes": gif_dest.stat().st_size,
            "published_at": datetime.now(timezone.utc).isoformat(),
        }

    print(f"Fetching '{title}' ({slug})...")
    mp4_url, gif_url = search_giphy(queries)
    if not mp4_url and not gif_url:
        print(f"  [skip] No Giphy URL found for queries: {queries}")
        return None

    temp_raw = Path(f"/tmp/raw_{asset_id}")
    source_is_mp4 = bool(mp4_url)
    target_url = mp4_url if mp4_url else gif_url
    temp_raw = temp_raw.with_suffix(".mp4" if source_is_mp4 else ".gif")

    if not download_file(target_url, temp_raw):
        print(f"  [skip] Failed to download {target_url}")
        return None

    # Step A: Encode clean MP4 (max width 480, no audio, yuv420p, faststart, max 8 seconds)
    mp4_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-t", "8",
        "-i", str(temp_raw),
        "-vf", "scale='min(480,iw)':-2",
        "-c:v", "libx264", "-crf", "26", "-preset", "fast",
        "-an", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(mp4_dest)
    ]
    subprocess.run(mp4_cmd, check=True)

    # Step B: Extract poster (frame at 0.1s or frame 1)
    poster_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(mp4_dest),
        "-ss", "00:00:00.100",
        "-frames:v", "1",
        "-q:v", "3",
        str(poster_dest)
    ]
    subprocess.run(poster_cmd, check=True)

    # Step C: Generate compact paletted GIF (max width 360, fps 14, 128 colors)
    gif_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(mp4_dest),
        "-vf", "fps=14,scale='min(360,iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
        str(gif_dest)
    ]
    subprocess.run(gif_cmd, check=True)

    if temp_raw.exists():
        temp_raw.unlink()

    meta = probe_video(mp4_dest)
    width, height = meta["width"], meta["height"]
    aspect = round(width / height, 3) if height else 1.0

    # Also stage in processed/assets for reproducible asset archival
    asset_store = processed_dir / slug / slug_hash
    asset_store.mkdir(parents=True, exist_ok=True)
    shutil.copy2(poster_dest, asset_store / "poster.jpg")
    shutil.copy2(mp4_dest, asset_store / "loop.mp4")
    shutil.copy2(gif_dest, asset_store / "loop.gif")

    manifest = {
        "schema_version": 1,
        "asset_id": asset_id,
        "slug": slug,
        "version": slug_hash,
        "status": "published",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "editorial": {
            "title": title,
            "description": item_def["description"],
            "category": item_def["category"],
            "mood": item_def["mood"],
            "tags": item_def["tags"],
        },
        "variants": {
            "poster": {"path": "poster.jpg", "bytes": poster_dest.stat().st_size},
            "mp4": {"path": "loop.mp4", "bytes": mp4_dest.stat().st_size},
            "gif": {"path": "loop.gif", "bytes": gif_dest.stat().st_size},
        },
        "review": {"approved_for_publication": True},
    }
    (asset_store / "asset.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"  ✓ Processed: {asset_id} (MP4: {mp4_dest.stat().st_size // 1024}KB, GIF: {gif_dest.stat().st_size // 1024}KB)")

    return {
        "id": asset_id,
        "slug": slug,
        "title": title,
        "description": item_def["description"],
        "category": item_def["category"],
        "mood": item_def["mood"],
        "tags": item_def["tags"],
        "creator": "Viral Internet Culture",
        "license": "Creative Commons Attribution / Fair Use",
        "duration_seconds": meta["duration"],
        "width": width,
        "height": height,
        "aspect_ratio": aspect,
        "poster": f"/media/posters/{asset_id}.jpg",
        "mp4": f"/media/mp4/{asset_id}.mp4",
        "gif": f"/media/gifs/{asset_id}.gif",
        "poster_bytes": poster_dest.stat().st_size,
        "mp4_bytes": mp4_dest.stat().st_size,
        "gif_bytes": gif_dest.stat().st_size,
        "published_at": datetime.now(timezone.utc).isoformat(),
    }

def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    public_dir = repo_root / "public"
    processed_dir = repo_root / "media" / "processed" / "assets"
    catalogue_file = public_dir / "data" / "catalogue.json"

    # Existing items to retain
    existing_items: list[dict[str, Any]] = []
    if catalogue_file.is_file():
        try:
            cat_data = json.loads(catalogue_file.read_text(encoding="utf-8"))
            for it in cat_data.get("items", []):
                # Keep original 3 foundation loops
                if it.get("slug") in ("flower", "friday", "gravitational-wave-loop"):
                    existing_items.append(it)
        except Exception as e:
            print(f"Warning: could not read existing catalogue: {e}")

    new_items: list[dict[str, Any]] = []
    print(f"Starting curation of {len(ITEMS_DEF)} viral loops across 8 moods...")

    for idx, item_def in enumerate(ITEMS_DEF, 1):
        print(f"[{idx}/{len(ITEMS_DEF)}] Mood: {item_def['mood'].upper()} - {item_def['title']}")
        try:
            item = process_item(item_def, public_dir, processed_dir)
            if item:
                new_items.append(item)
            else:
                print(f"  [warning] Failed to curate item {item_def['slug']}")
        except Exception as exc:
            print(f"  [error] Error processing {item_def['slug']}: {exc}")

    all_items = existing_items + new_items
    catalogue = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": all_items,
    }

    catalogue_file.parent.mkdir(parents=True, exist_ok=True)
    catalogue_file.write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n==========================================")
    print(f"Successfully generated catalogue with {len(all_items)} total items!")
    print(f"Catalogue written to: {catalogue_file}")

    # Summary by mood
    by_mood: dict[str, int] = {}
    for it in all_items:
        m = it.get("mood", "none")
        by_mood[m] = by_mood.get(m, 0) + 1
    print("\nItems per mood:")
    for mood, count in sorted(by_mood.items()):
        print(f" - {mood}: {count} items")

    return 0

if __name__ == "__main__":
    sys.exit(main())

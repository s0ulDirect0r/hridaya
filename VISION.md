# Hridaya Vision

## Purpose

Hridaya is a platform for cultivating **bodhicitta** — the awakening heart-mind, the aspiration to attain enlightenment for the benefit of all beings.

## Core Insight

Contemplative practices from different traditions — brahmaviharas, Zhan Zhuang, Unified Mindfulness, body scanning — aren't separate disciplines. They're complementary methods for integrated development across body, heart, and awareness. The unifying thread is bodhicitta.

## Practice Systems

All practice systems share common structure: session, duration, instructions, reflection. Each develops a different dimension:

| System | Dimension | Focus |
|--------|-----------|-------|
| Brahmaviharas | Heart | Metta, karuna, mudita, upekkha — relational qualities |
| Zhan Zhuang / Qi Gong | Body | Embodiment, grounding, energy cultivation |
| Unified Mindfulness | Awareness | Sensory clarity, concentration, equanimity |
| Body Scanning | Soma | Somatic awareness, presence, felt sense |

## AI Companion

The platform includes an AI presence that knows your practice:

- **Remembers context**: Recalls past sessions, struggles, breakthroughs when relevant
- **Notices patterns**: Surfaces insights you might not see yourself
- **Offers encouragement**: Acknowledges effort, milestones, consistency

This isn't a passive tracker. It's a relational presence that holds the bigger picture of your practice development.

## Problems Solved

1. **Consolidation**: One home for all practices instead of fragmented systems
2. **Big picture visibility**: Understanding your practice trajectory over time
3. **Accountability**: Structure and presence that supports consistency
4. **Practice selection**: Help deciding what to practice on a given day

## Build Approach

Scaffold the multi-system architecture first, then fill in each practice system. This means:

1. Abstract the current brahmavihara-specific types into a general practice system model
2. Build the infrastructure to support multiple practice systems
3. Add each new system (Zhan Zhuang, UM, Body Scanning) into the scaffold
4. Develop the AI companion capabilities incrementally

## What's Next

The brahmaviharas implementation is the foundation. Next steps:
- Generalize the type system to support multiple practice systems
- Add the three new practice systems (minimal viable versions)
- Build the AI companion layer for context, patterns, and encouragement

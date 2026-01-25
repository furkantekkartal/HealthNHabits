# Diet & Activity Tracker 🥗📊

A **mobile-first, AI-assisted diet and activity tracking app** designed for real daily use.
This project focuses on **speed, clarity, and habit formation**, combining AI-powered analysis with fast manual logging.

> 📐 **Draft app designs and UI flows are already provided in the project directory** and are considered the source of truth for frontend and backend implementation.

---

## 🚀 Project Vision

Most health apps fail because logging is slow and overwhelming.
This app is built to be **opened multiple times per day without friction**.

**Core idea:**
Fast daily input > perfect accuracy.

AI helps users log faster, but users always stay in control.

---

## ✨ Key Features

### 🍽️ Food Tracking (Two Ways)

#### 1. AI Food Photo Analysis

* Take or upload a photo of food
* AI estimates:

  * Calories (kcal & kJ)
  * Protein, carbs, sugar, fat
  * Portion size
* Results are **fully editable**
* Meals can be saved as reusable catalog items

#### 2. Product Catalog (Fast Logging)

* Personal catalog of frequently consumed foods & drinks
* Examples:

  * 600 ml water bottle
  * Latte (small / medium / large)
  * Hot chocolate
* Features:

  * One-tap add
  * Variants & quantities
  * Most-used items appear first
  * Manual reordering
  * Custom product creation
  * Products can be added from AI analysis

---

### 💧 Water Tracking

* Daily water intake tracking
* Quick-add buttons for common volumes
* Water progress shown clearly on the main dashboard
* Water logged via:

  * Catalog items
  * Manual quick add

---

### 🚶 Steps & Activity Tracking

* Manual daily step entry
* AI calculates calories burned using:

  * Gender
  * Height
  * Weight
  * Age
  * Stride length (optional)
* Burned calories contribute to daily balance

---

### ⚖️ Weight Tracking

* Simple weight entry by date
* Historical weight data stored
* Weight trends displayed via charts

---

### 🧍 Physical Profile

Used for accurate AI calculations:

* Gender
* Birth year
* Height
* Weight
* Activity level
* Optional stride length

Editable at any time.

---

## 🏠 Dashboard (Core Screen)

The dashboard shows **today at a glance**:

* Calories consumed
* Calories burned
* Remaining calories
* Water intake progress
* Step count
* Quick actions:

  * Add water
  * Add food from catalog
  * Take food photo
  * Add steps
  * Add weight

This screen is the center of daily usage.

---

## 🧠 Design Philosophy

* Fast daily logging beats perfect data
* AI assists, never blocks
* Everything is editable
* Most-used actions are always one tap away
* Designed for habit formation, not obsession

---

## 🗂️ Project Structure

```
/designs        -> Draft UI/UX designs and app flows (source of truth)
/frontend       -> Mobile/web frontend implementation
/backend        -> API, database, AI integration
/docs           -> Architecture & technical documentation
```

> ⚠️ **Important:**
> Frontend and backend implementations must strictly follow the designs located in the `designs/` directory.

---

## 🛠️ Tech Stack (Planned)

**Frontend**

* React or React Native
* Mobile-first design
* Charting for trends & summaries

**Backend**

* Node.js + Express/Fastify
* MongoDB
* REST APIs
* AI microservices for:

  * Food image analysis
  * Step-based calorie burn calculation

---

## 🎯 Target Users

* People who want awareness, not obsession
* Users who value speed and simplicity
* Anyone tired of overcomplicated nutrition apps

---

## 📌 Project Status

🚧 Active development
Designs are complete. Frontend and backend are being implemented based on those designs.

---

## 📄 License

TBD

---

**In one sentence:**
*A fast, AI-assisted diet and activity tracker built for real daily life — not perfect data.*

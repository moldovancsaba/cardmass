# CardMass User Guide

**Version**: 1.2.0  
**Updated**: 2025-01-15T10:30:00.000Z

> For overarching product + development context, begin with `HANDBOOK.md`. This guide focuses on end-user workflows.

Welcome to CardMass! This guide will help you understand how to use CardMass to organize and classify your cards across multiple dimensions.

---

## 📚 Table of Contents

1. [What is CardMass?](#what-is-cardmass)
2. [Core Concepts](#core-concepts)
3. [Getting Started](#getting-started)
4. [Working with Organizations](#working-with-organizations)
5. [Creating and Managing Boards](#creating-and-managing-boards)
6. [Working with Cards](#working-with-cards)
7. [Understanding Areas](#understanding-areas)
8. [The Spock Area (Inbox)](#the-spock-area-inbox)
9. [N-Dimensional Classification](#n-dimensional-classification)
10. [Sharing Boards](#sharing-boards)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## What is CardMass?

CardMass is a **multi-dimensional card classification system** that lets you organize items (cards) across multiple boards, with each board representing a different dimension or perspective.

### Use Cases

- **Project Management**: Classify tasks by priority, complexity, impact, and resources
- **Product Planning**: Organize features by importance, effort, user value, and risk
- **Decision Making**: Evaluate options across multiple criteria
- **Knowledge Management**: Categorize information by topic, difficulty, relevance, and status

### Key Features

- ✅ Multi-tenant architecture (organizations)
- ✅ N-dimensional classification (multiple boards per card)
- ✅ Drag-and-drop interface
- ✅ Real-time updates
- ✅ Board sharing with passwords
- ✅ Visual hashtags showing card positions
- ✅ Flexible grid layouts

---

## Core Concepts

### 🏢 **Organization**

An **organization** is the top-level container for all your data. Each organization has:
- Unique identifier (UUID)
- Name and optional description
- Its own set of boards, cards, and users

**Example**: Your company, team, or personal workspace

### 📋 **Board**

A **board** represents **one dimension** of classification. Each board has:
- A grid of **areas** (labeled territories)
- A specific perspective or criterion
- Optional background styling
- Unique identifier (UUID)

**Example Boards**:
- Priority Board (areas: High, Medium, Low)
- Complexity Board (areas: Simple, Moderate, Complex)
- Impact Board (areas: High Impact, Medium Impact, Low Impact)

### 🎴 **Card**

A **card** is a single item you want to classify. Cards:
- Contain text content
- Can be placed on **multiple boards**
- Show hashtags indicating their position on other boards
- Can be dragged between areas
- Can be archived when no longer needed

**Example**: "Implement user authentication" (a feature or task)

### 📍 **Area**

An **area** is a labeled territory on a board where cards can be placed. Areas:
- Have a label (e.g., "High Priority", "Complex", "Low Impact")
- Can have custom background colors
- Define the classification on that dimension

**Example**: On a Priority Board, you might have areas: "Critical", "High", "Medium", "Low"

### 🖖 **Spock Area (Inbox)**

The **Spock area** is a special virtual inbox that:
- Appears on every board automatically
- Contains cards **not yet placed** on that specific board
- Is never saved to the database (virtual only)
- Named after the character from Star Trek (logical, organized)

**Why "Spock"?**: When you create a card or view a board, cards without a placement on that board appear in Spock - it's your "to be classified" inbox for that dimension.

---

## Getting Started

### Step 1: Sign In

1. Navigate to CardMass homepage at `https://cardmass.doneisbetter.com`
2. You'll see a unified login page for all user types
3. Enter your email and password
4. Click **"Sign In"**

**Note**: This login page works for all users - super-admins, organization admins, and members.

### Step 2: Select Your Organization

After successful login, you'll be directed to the **Organizations** page where you can:
- See all organizations you have access to
- View organization details (name, description)
- See your role badge (Super Admin, Admin, or Member)
- Click on any organization card to enter it

### Step 3: Explore the Organization Dashboard

Once inside an organization, you'll see:
- **Organization name** displayed prominently
- **List of boards** with Tagger, Edit, and Password buttons
- **Creator button** to create new boards
- **Organization Settings button** (admins only) for management functions
- **Back to Orgs** button to return to organization selector

### Step 4: Create Your First Board

Click **"Creator"** and define:
1. **Board Name**: e.g., "Priority Classification"
2. **Grid Size**: Number of rows and columns (e.g., 3x3)
3. **Areas**: Label each grid cell with meaningful names
4. **Styling** (optional): Background colors, text colors

---

## Working with Organizations

### Viewing Organizations

- Navigate to `/organizations` to see all organizations you have access to
- Each organization card shows:
  - Organization name
  - Slug (URL identifier)
  - Description (if set)
  - Your role badge

### Organization Navigation

The navigation flow is:
1. **Login** (`/`) → Enter credentials
2. **Organizations** (`/organizations`) → Select organization
3. **Organization Main** (`/{orgUUID}`) → View boards and take actions
4. **Organization Settings** (`/{orgUUID}/settings`) → Admin functions (admins only)

### Organization Roles

- **Super Admin**: Full access to all organizations and system settings
- **Org Admin**: Full access to a specific organization (can manage settings)
- **Member**: View and edit access to a specific organization

### Organization Settings (Admins Only)

If you're an organization admin or super-admin, you'll see an **⚙️ Organization Settings** button on the organization main page. This opens a tabbed interface with:

#### Tab 1: Organization Management
- Edit organization name, slug, and description
- Toggle organization active status
- Save or delete the organization

#### Tab 2: User Management
- *Coming soon* - Manage user access and roles

#### Tab 3: Board Management
- Rename boards
- Delete boards
- View board metadata

#### Tab 4: Access Passwords
- *Coming soon* - Centralized password management
- For now, generate passwords from the organization main page

---

## Creating and Managing Boards

### Creating a Board

**Method 1: Using the Creator Tool**

1. Click **"Open Creator"** from organization page
2. Fill in board details:
   - **Name**: Descriptive name (e.g., "Task Priority")
   - **Slug** (optional): URL-friendly identifier
   - **Rows**: Number of rows in grid (e.g., 3)
   - **Columns**: Number of columns in grid (e.g., 3)
3. **Label Areas**: Click each grid cell to set its label
4. **Style Areas** (optional):
   - Background color
   - Text color
   - Layout preference
5. Click **"Save Board"**

**Method 2: Quick Create (Admin Panel)**

1. Go to Organization Admin panel
2. Navigate to "Boards" tab
3. Use the quick create form:
   - Board name
   - Rows × Columns
4. Click "Create" - areas will be auto-generated

### Board Settings

Each board can have:

- **Name**: Display name
- **Slug**: URL-friendly identifier (metadata only)
- **Grid Size**: Rows × Columns layout
- **Background CSS**: Custom background styling
- **Areas**: Labeled grid cells with styling

### Editing a Board

1. Open the board in Tagger view
2. Click **"Edit Board"** button
3. Opens Creator with current board loaded
4. Modify areas, styling, or layout
5. Save changes

### Deleting a Board

⚠️ **Warning**: Deleting a board removes all card placements on that board!

1. Go to Organization Admin → Boards tab
2. Find the board
3. Click "Delete" button
4. Confirm deletion

---

## Working with Cards

### Creating a Card

**From Tagger View**:

1. Open a board in Tagger view
2. Cards without placement appear in **Spock area** (top-left)
3. Click **"+ Add Card"** button
4. Enter card content (text)
5. Card appears in Spock area
6. Drag to desired area to classify

**Note**: Cards are **organization-scoped**, not board-scoped. Once created, a card exists across all boards in that organization.

### Placing a Card

1. **Drag** the card from Spock (or current area)
2. **Drop** it onto the target area
3. Card position is saved automatically
4. Hashtag updates to reflect new position

### Moving a Card Between Areas

1. Click and **hold** on the card
2. **Drag** to the new area
3. **Release** to drop
4. Position updates automatically

### Viewing Card Details

1. Click on a card to open the **detail modal**
2. View:
   - Full card text
   - Hashtags (positions on other boards)
   - Board placements
3. Edit card text if needed
4. Click outside or "Close" to dismiss

### Editing a Card

**Quick Edit** (from Tagger):
1. Click on the card
2. Edit text in the modal
3. Changes save automatically

**Bulk Edit** (from card detail page):
1. Navigate to `/{orgUUID}/cards/{cardUUID}`
2. Full card detail view
3. See all board placements
4. Edit content

### Archiving a Card

When a card is no longer needed:

1. Click on the card
2. Click **"Archive"** button
3. Card is hidden from boards
4. Can be restored later if needed

**Note**: Archived cards don't appear in Tagger views but remain in the database.

---

## Understanding Areas

### What is an Area?

An **area** is a labeled space on a board where cards can be placed. Think of it as a category or classification bucket for that board's dimension.

### Area Properties

Each area has:

1. **Label**: The classification name (e.g., "High Priority")
2. **Background Color** (optional): Visual distinction
3. **Text Color** (optional): For readability
4. **Position**: Row/column in the grid

### Styling Areas

**In Creator Mode**:

1. Click on an area
2. Set:
   - **Label**: Classification name
   - **BgColor**: Hex color code (e.g., #FF5733)
   - **Text Color**: Black or white for contrast
   - **Row First**: Dense packing preference
3. Save board

**Visual Feedback**:
- Area backgrounds tint cards at 70% opacity
- Hashtags show the area color from other boards
- Cards visually "belong" to their area

---

## The Spock Area (Inbox)

### What is Spock?

**Spock** is a virtual inbox area that appears on every board. It contains cards that **don't have a placement** on that specific board yet.

### Why "Spock"?

Named after Mr. Spock from Star Trek:
- Logical and organized
- Temporary holding place
- Encourages classification (being logical about where things belong)

### How Spock Works

1. **Appears Automatically**: Every board has a Spock area (top-left)
2. **Virtual Only**: Spock is never saved to the database
3. **Per-Board**: Each board's Spock shows different cards
4. **Dynamic**: As you place cards, they leave Spock

### When Cards Appear in Spock

A card appears in Spock on a board when:
- Card was just created (no placements yet)
- Card has placements on other boards but not this one
- Card was removed from all areas on this board

### Working with Spock

**Viewing Spock Cards**:
- Spock area is always visible (unless collapsed)
- Shows count of unplaced cards
- Displays cards in a list/grid

**Classifying from Spock**:
1. Drag card from Spock
2. Drop onto an area
3. Card leaves Spock (now classified)
4. Hashtag appears for this board

**Collapsing Spock**:
- Click the collapse button (if available)
- Cards expand to use full width
- Toggle back to show Spock

---

## N-Dimensional Classification

### What is N-Dimensional Classification?

CardMass allows you to classify **the same card** on **multiple boards**, with each board representing a different dimension.

### Example: Task Classification

**Card**: "Implement user authentication"

**Dimensions** (Boards):
1. **Priority Board** → Placed in "High" area
2. **Complexity Board** → Placed in "Complex" area
3. **Impact Board** → Placed in "High Impact" area
4. **Resources Board** → Placed in "Backend Team" area

### How It Works

1. Create a card on any board
2. Card appears in **Spock** on all other boards
3. Drag card from Spock to area on each board
4. Each placement is independent
5. Hashtags show positions on other boards

### Viewing All Dimensions

**From Tagger View**:
- Hover over card to see hashtags
- Each hashtag represents a position on another board
- Hashtag color matches the area color

**From Card Detail**:
- Click on card to open detail modal
- See all board placements listed
- Navigate to other boards from modal

### Benefits of N-Dimensional Classification

- **Multi-perspective analysis**: View items from multiple angles
- **Better decision making**: Consider multiple criteria
- **Flexible organization**: Not locked into single categorization
- **Visual insights**: Hashtags provide quick overview

---

## Sharing Boards

### Board Password Protection

Boards can be protected with passwords for sharing with non-admin users.

### Generating a Board Password

**From Organization Page**:

1. Navigate to organization
2. Find the board in the list
3. Click **🔑 Password** button
4. Password is generated automatically (32-hex token)
5. Modal shows:
   - Password string
   - Shareable link with `?pw=` parameter
   - Copy buttons for both

### Sharing a Board

**Option 1: Share the Password**
1. Copy the password from modal
2. Send password to recipient
3. Recipient enters password when accessing board
4. Password is remembered for future visits

**Option 2: Share the Link**
1. Copy the shareable link (includes `?pw=` parameter)
2. Send link to recipient
3. Password auto-validates when they click link
4. No manual entry needed

### Accessing a Protected Board

**With Password**:
1. Navigate to board URL
2. Password prompt appears
3. Enter password
4. Click "Unlock"
5. Access granted

**With Shareable Link**:
1. Click shared link
2. Password validates automatically
3. Access granted immediately

### Admin Bypass

- **Admin users** (logged in) bypass password protection
- Green banner shows "Admin bypass active"
- No password needed for any board

---

## Tips and Best Practices

### Board Design

✅ **Keep grids manageable**: 3×3 or 4×4 works well  
✅ **Use clear labels**: Make area names obvious  
✅ **Consistent dimensions**: Similar classification types across boards  
✅ **Color coding**: Use colors meaningfully (red = urgent, green = good)  

❌ **Avoid**: Too many areas (hard to distinguish)  
❌ **Avoid**: Vague labels like "Other" or "Misc"  

### Card Management

✅ **Concise text**: Keep card content brief and clear  
✅ **One concept per card**: Don't combine unrelated items  
✅ **Regular classification**: Process Spock regularly  
✅ **Archive old cards**: Keep boards current  

❌ **Avoid**: Long paragraphs in cards  
❌ **Avoid**: Duplicate cards across organizations  

### Organization

✅ **Meaningful dimensions**: Each board should represent a distinct perspective  
✅ **Complete classification**: Place cards on all relevant boards  
✅ **Review regularly**: Update placements as priorities change  
✅ **Use hashtags**: Quick visual reference for multi-board positions  

### Workflow Suggestions

**Daily**:
- Check Spock areas for new cards
- Classify unplaced cards
- Review and adjust priorities

**Weekly**:
- Review all boards for outdated cards
- Archive completed items
- Adjust placements based on changes

**Monthly**:
- Audit board structure
- Consider new dimensions (boards)
- Clean up archived cards

---

## Troubleshooting

### Common Issues

**Q: Cards don't appear on a board**  
A: Check if card is archived. Archived cards don't show in Tagger views.

**Q: Can't drag cards**  
A: Ensure you have edit permissions. Check if board is password-protected and you're authenticated.

**Q: Hashtags not showing**  
A: Hashtags only appear when card is placed on multiple boards. Place card on another board to see hashtags.

**Q: Spock area is empty but I have cards**  
A: All cards are already placed on this board. Check the areas for your cards.

**Q: Lost password for a board**  
A: Contact an admin to regenerate the password via the 🔑 button.

**Q: Changes not saving**  
A: Check your network connection. Changes save automatically but require active connection.

### Getting Help

- Check the [README.md](./README.md) for technical details
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Contact your organization admin for access issues
- Check browser console for error messages

---

## Keyboard Shortcuts

*Note: Keyboard shortcuts are not currently implemented but could be added in future versions*

**Planned**:
- `N` - New card
- `E` - Edit selected card
- `A` - Archive card
- `Space` - Toggle Spock area
- `Esc` - Close modals

---

## Advanced Features

### Board Background Styling

You can customize board backgrounds with CSS:

```css
background-color: #2A7B9B;
background-image: 
  url("https://example.com/background.jpg"),
  linear-gradient(90deg, rgba(42,123,155,1) 0%, rgba(87,199,133,1) 50%);
background-repeat: no-repeat, no-repeat;
background-size: cover, cover;
background-position: center, center;
```

**Where to set**:
- Creator tool → "Board background (CSS)"
- Organization page → "Create Board" form

### Organization-Level User Management

**Org Admins** can:
- Add users to organization
- Assign roles (org-admin, member)
- Generate and reset passwords
- Remove users from organization

**Access**: Organization page → "Admin Panel" → "User Management" tab

---

## Best Practices Summary

### Do's ✅

- Start with 2-3 key dimensions (boards)
- Use clear, consistent labeling
- Classify cards promptly (don't let Spock overflow)
- Review and update regularly
- Archive completed cards
- Use board passwords for external sharing
- Leverage N-dimensional views for insights

### Don'ts ❌

- Don't create too many boards (diminishing returns)
- Don't leave cards unclassified indefinitely
- Don't use vague area labels
- Don't forget to archive old cards
- Don't share admin credentials for board access (use passwords)

---

## Glossary

| Term | Definition |
|------|------------|
| **Organization** | Top-level container for all data |
| **Board** | One dimension of classification with grid of areas |
| **Card** | Item to be classified across multiple boards |
| **Area** | Labeled space on a board where cards are placed |
| **Spock** | Virtual inbox for unplaced cards on a board |
| **Hashtag** | Visual indicator of card position on other boards |
| **Tagger** | Main interface for viewing and classifying cards |
| **Creator** | Tool for designing and editing boards |
| **UUID** | Unique identifier for orgs, boards, and cards |
| **Placement** | Assignment of a card to an area on a specific board |

---

## Version History

- **v1.0.0** (2025-10-05): Initial user guide release

---

## Feedback and Support

For questions, issues, or feature requests:
- Check project documentation
- Contact your organization administrator
- Review [GitHub repository](https://github.com/moldovancsaba/cardmass) for updates

---

**Happy Organizing with CardMass!** 🎴📋✨

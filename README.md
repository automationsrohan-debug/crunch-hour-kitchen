# Crunch Hour Kitchen

Build a complete, modern, mobile-responsive full-stack fast-food restaurant web application called KRUNCH HOUR for a small restaurant in Pakistan.

This must be a functional restaurant ordering and management application, not just a landing page or static UI mockup.

1. Brand and design

Brand name: KRUNCH HOUR, 

Use a premium fast-food visual identity:

Deep maroon: #982121

Golden yellow: #ffc107

White: #FFFFFF

Use modern typography, attractive food imagery, rounded product cards, subtle animations, responsive layouts, and professional mobile navigation.

I will upload my restaurant logo. Use the actual uploaded logo throughout the website.

Make the design feel like a modern premium fast-food brand, not a generic corporate website.

2. Customer website

Create these pages:

Home

Order Online / Menu

Deals & Offers

About Us

Contact

Cart

Checkout

Order Tracking

Homepage:

Large appetizing food hero section

Prominent Order Now button

Six food category cards

Featured products

Special deals

Delivery and pickup information

Restaurant contact and opening hours

Food categories:

Pizza

Chicken Burgers

Fries

Pasta

Wraps

Cold Drinks

Customers must be able to:

Browse and search menu items

Filter products by category

Choose product sizes and variations

Select optional toppings and add-ons

Adjust quantities

Add items to cart

Apply valid discount codes

Choose home delivery or pickup

Enter customer name and Pakistani phone number

Enter delivery address only for delivery orders

Add order instructions

Place orders with Cash on Delivery or Cash on Pickup

View order confirmation and order status

Use PKR (Rs.) throughout.

Do not require customers to create accounts to order.

3. Database and backend

Use a proper persistent database and server-side business logic.

Create tables for:

Products

Categories

Product variations

Add-ons

Customers

Orders

Order items

Payments

Coupons

Staff users and roles

Ingredients

Recipes

Stock movements

Suppliers

Expenses

Restaurant settings

Audit logs

Create proper relationships, indexes, validation, and access control.

All order totals, discounts, delivery charges, and inventory changes must be validated on the server, not trusted from the browser.

4. Admin dashboard

Create a protected admin portal at /admin.

Features:

Secure staff login

Overview of today's sales

New orders

Pending orders

Completed orders

Revenue and expenses

Product management

Category management

Pricing and availability

Customer history

Discount management

Restaurant opening hours

Delivery charges and zones

Staff role management

Admin must be able to create, update, disable, and delete menu items without editing code.

5. Order management

Implement order statuses:

New

Accepted

Preparing

Ready

Out for Delivery

Completed

Cancelled

Orders must be stored persistently.

Provide a kitchen-friendly screen that shows new orders, quantities, customizations, and preparation notes.

Support manual rider assignment and order status updates.

6. Point of Sale (POS)

Create a staff-only POS at /pos.

Features:

Fast touchscreen-friendly product selection

Category filtering

Cart and quantity controls

Walk-in and takeaway orders

Cash payments

Manual discount with authorization

Printable receipt

Daily sales history

Shared order database with online orders

Do not require paid third-party POS software.

7. Inventory management

Create ingredient-based inventory.

Examples:

Burger buns

Chicken

Cheese

Sauces

Flour

Packaging

Admin should define recipes for menu items.

When an order is completed, deduct the required ingredient quantities exactly once.

Support manual stock adjustments, low-stock alerts, and purchase entries.

Prevent duplicate deductions and maintain a stock movement history.

8. CRM

Create customer records from orders.

Store:

Name

Phone number

Order history

Total spending

Last order date

Customer notes

Provide customer search and basic segmentation.

9. Expense management

Create an expense dashboard.

Categories:

Ingredients

Packaging

Rent

Electricity

Gas

Salaries

Delivery

Maintenance

Miscellaneous

Allow manual expense entries, filtering by date, and reports.

Show revenue, expenses, and an estimated operating result. Do not mislabel revenue minus manually entered expenses as accurate net profit if ingredient costs or other costs are missing.

10. Security and reliability

Role-based access control

Protected admin, POS, and kitchen routes

Database row-level security or equivalent authorization

No public access to customer records

Server-side input validation

No hardcoded passwords or secrets

Safe order creation and inventory transactions

Error handling and loading states

Mobile-responsive interface

Accessible buttons and forms

Do not use fake authentication or browser localStorage as the main database.

11. Technical requirements

Prefer React, TypeScript, Tailwind CSS, and a backend compatible with Supabase or an equivalent PostgreSQL service.

Keep the application portable so it can later be deployed on low-cost hosting.

Do not require paid APIs, paid AI services, paid payment gateways, or premium software for core functionality.

Provide sample menu products clearly marked as demo data, with editable prices. Do not invent actual restaurant contact information, address, opening hours, or delivery zones.

12. Build process

Implement this in phases, prioritizing working features over visual mockups.

Phase 1: Customer website, product database, cart, delivery/pickup checkout, persistent orders, and basic admin order management.

Phase 2: Staff authentication, POS, kitchen screen, and customer history.

Phase 3: Ingredient inventory, recipe deduction, expense tracking, reporting, and additional CRM features.

Start with Phase 1. Create a working end-to-end order flow and test it before proceeding.

Explain which features are actually implemented, which are placeholders, and what needs configuration. Do not claim a feature is functional until it is connected to the database and tested.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://crunch-hour-kitchen.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e60858b-891f-5c23-b20d-b254c8bc6ece).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

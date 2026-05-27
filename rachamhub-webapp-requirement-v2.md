**RACHAMHUB LIMITED**

Web Application

**Document of Operation**

| Document Type       | Product Requirements, Internal                                                   |
| :------------------ | :------------------------------------------------------------------------------- |
| **Modules Covered** | Customer Service • Warehouse & Inventory • Fleet Operations • Accounting • Admin |
| **Prepared For**    | Development Team                                                                 |
| **Company**         | RachamHub Limited, Lagos, Nigeria                                                |
| **Version**         | 2.0 \- Full Draft                                                                |
| **Classification**  | Confidential Internal Use Only                                                   |

**1\. Overview**  
This document defines the complete functional requirements for the RachamHub web application. It covers five role-based modules: Customer Service, Warehouse & Inventory, Fleet Operations Manager, Accounting, and Administrator.

The application is intentionally simple and fast designed for daily use by non-technical staff across RachamHub’s logistics operation. Each department logs in to their own dashboard and sees only what is relevant to their role.

**1.1 The Five Roles**

| Role                       |    Who Uses It     |               Primary Job in the App               |
| :------------------------- | :----------------: | :------------------------------------------------: |
| **Customer Service (CC)**  |     CC Agents      | Receive orders via WhatsApp, paste and submit them |
| **Warehouse & Inventory**  |  Warehouse Staff   |      Pack orders, assign to FOM, print order       |
| **Fleet Operations (FOM)** |    FOM 1, 2, 3     | Assign riders, record delivery outcomes & payments |
| **Accounting**             |     Accountant     |  Confirm payments received and reconcile accounts  |
| **Administrator**          | Manager / Ops Lead |     Manage users, merchants, and view all data     |

**1.2 Order Flow Summary**

Every order pass through the following departments in sequence:

| Step  |       Department       |                 Action                  |                  Outcome                   |
| :---- | :--------------------: | :-------------------------------------: | :----------------------------------------: |
| **1** |    Customer Service    |          Paste & submit order           |    Order saved; all dashboards notified    |
| **2** | Warehouse & Inventory  |    Pack, assign to FOM, print Order     |      FOM dashboard receives the order      |
| **3** | Fleet Operations (FOM) | Assign rider, record delivery & payment | Order marked Delivered / Failed / Returned |
| **4** |       Accounting       |             Confirm payment             |          Financial record closed           |
| **5** |     Administrator      |          Oversight & reporting          |        Full visibility at all times        |

**1.3 Shared Design Rules**

- Every user logs in with a unique email and password.

- CC-entered order data is read-only for all other departments — only CC can edit it.

- All dashboards update in real time (within 5 seconds of any change).

- Every action is time-stamped and tagged to the user who performed it.

- The app must work fully on mobile phones and tablets.

- User accounts are created only by the Administrator.

| Module 01 Customer Service _Order entry, AI extraction, and CC dashboard_ |
| :-----------------------------------------------------------------------: |

**2.1 Login**

Each CC agent logs in with a unique email and password. Credentials are created and managed by the Administrator.

- A failed login displays a clear error message.

- Passwords are stored securely (hashed — never plain text).

- Sessions expire after 1 hours of inactivity.

- Every submission is auto-stamped with the agent’s name, date, and time.

**2.2 Order Entry Page**

After login, the CC agent lands directly on the Order Entry page. The workflow is:

- Paste the raw order text from WhatsApp (or any channel) into the input area.

- The AI engine reads the text and auto-fills all order fields instantly.

- CC agent reviews the extracted fields, corrects anything if needed.

- CC agent selects the Merchant name from the dropdown.

- CC agent optionally adds a Comment.

- CC agent clicks Submit — the order is saved and pushed to all dashboards.

| \!  | Note: The Submit button is disabled until a Merchant is selected. This is the only mandatory manual step — everything else is AI-extracted. |
| :-: | :------------------------------------------------------------------------------------------------------------------------------------------ |

**AI-Extracted Fields**

The following fields are automatically populated from the pasted order text:

| Field                |                    Description                    | Source | Required |
| :------------------- | :-----------------------------------------------: | :----: | :------: |
| **Customer Name**    |             Full name of the customer             |   AI   |   Yes    |
| **Delivery Address** | Full address including street, area, and landmark |   AI   |   Yes    |
| **Phone Number(s)**  |      Primary and any alternate phone numbers      |   AI   |   Yes    |
| **Product Name**     |   Name or description of the product(s) ordered   |   AI   |   Yes    |
| **Quantity**         |            Number of units per product            |   AI   |   Yes    |
| **Order Amount (₦)** |            Total order value in Naira             |   AI   |   Yes    |
| **Merchant**         |    Manually selected from dropdown by CC agent    | Manual |   Yes    |
| **Comment**          |     Optional internal note from the CC agent      | Manual |    No    |

**2.3 CC Dashboard**

All submitted orders appear as rows in the CC dashboard table. The agent sees every order entered for the current day.

| Column               |                 Description                  | CC Can Edit? |
| :------------------- | :------------------------------------------: | :----------: |
| **Order ID**         |        Auto-generated (e.g. RCH-0001)        |  No — Auto   |
| **Timestamp**        |         Date and time of submission          |  No — Auto   |
| **Customer Name**    |                 AI-extracted                 |    Yes\*     |
| **Delivery Address** |                 AI-extracted                 |    Yes\*     |
| **Phone Number(s)**  |                 AI-extracted                 |    Yes\*     |
| **Product Name**     |                 AI-extracted                 |    Yes\*     |
| **Quantity**         |                 AI-extracted                 |    Yes\*     |
| **Order Amount (₦)** |                 AI-extracted                 |    Yes\*     |
| **Merchant**         |             Selected by CC agent             |    Yes\*     |
| **Comment**          |              Added by CC agent               | Yes — always |
| **Status**           | Current fulfillment stage (view only for CC) |      No      |
| **Entered By**       |         CC agent name, auto-stamped          |  No — Auto   |

| \!  | Note: CC agents can edit order fields only while the order status is still Pending. Once Warehouse marks the order as Packed, all CC fields become read-only except the Comment field. |
| :-: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Module 02 Warehouse & Inventory _Packing, assignment to FOM, and waybill printing_ |
| :--------------------------------------------------------------------------------: |

**3.1 Login**  
Warehouse staff log in with email and password. Accounts are created by the Administrator only.

**3.2 Warehouse Dashboard**

The Warehouse dashboard displays all orders received from Customer Service in read-only mode. Warehouse staff cannot edit any CC-entered field. They view CC data and add their own operational columns.

| \!  | Note: All fields from the CC department (Name, Address, Phone, Product, Quantity, Amount, Merchant, Comment) appear in the Warehouse dashboard in read-only mode. Warehouse staff can only write to their own columns listed below. |
| :-: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CC Fields (Read-Only in Warehouse)**

Customer Name • Delivery Address • Phone Number(s) • Product Name • Quantity • Order Amount • Merchant • CC Comment

**Warehouse-Owned Fields (Writable)**

| Field                |                                  Description                                   | Input Type |
| :------------------- | :----------------------------------------------------------------------------: | :--------: |
| **Delivery Status**  | Current delivery outcome: Delivered / Cancelled / Shelved / Returned / Pending |  Dropdown  |
| **Inventory Status** |                Packing state: Packed / Unpacked / out of stock                 |  Dropdown  |
| **Assigned To**      |             FOM personnel to handle this order: FOM1 / FOM2 / FOM3             |  Dropdown  |
| **Comment**          |                  Any internal warehouse note about this order                  |    Text    |

**3.3 Assigning to FOM**

When an order is packed and ready, the Warehouse staff selects the FOM assignee from the Assigned To dropdown. Once assigned, the order appears in the relevant FOM dashboard automatically.

- Available options: FOM1, FOM2, FOM3

- An order must be assigned to an FOM before it appears in any FOM dashboard.

- Warehouse cannot change the assignment once the FOM has acted on the order.

**3.4 Print Order slip**

Each order row has a Print button. When clicked, the system generates a printed order containing only the customer-facing delivery information:

| Included on Package   | Not Included on Package |
| :-------------------- | :---------------------: |
| **Call before going** |                         |
| **Customer Name**     |      CC Agent Name      |
| **Delivery Address**  |    Warehouse Comment    |
| **All Phone Numbers** | Internal Status Fields  |
| **Product Name**      |                         |
| **Quantity**          |                         |
| **Order Amount**      |                         |
| **Order ID**          |                         |

| \!  | Note: The Print action also submits the order to the assigned FOM’s dashboard simultaneously. If this is not technically feasible in the first version, a separate Submit button should be placed next to Print as a fallback. |
| :-: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Module 03 Fleet Operations Manager (FOM) _Rider dispatch, delivery tracking, and payment recording_ |
| :-------------------------------------------------------------------------------------------------: |

**4.1 Who Are the FOMs?**

Fleet Operations Managers (FOM1, FOM2, FOM3) are the personnel responsible for dispatching riders based on delivery location zones. Each FOM sees only the orders assigned to them by Warehouse.

**4.2 FOM Dashboard**

The FOM dashboard shows all orders assigned to that specific FOM by Warehouse. Like Warehouse, the FOM sees CC data in read-only mode and fills only their own operational fields.

**Fields Visible to FOM (Read-Only)**

Customer Name • Product Name • Quantity • Order Amount (₦) • Amount by merchant • Delivery Address • Merchant

**FOM-Owned Fields (Writable)**

| Field                    |                                Description                                | Input Type |
| :----------------------- | :-----------------------------------------------------------------------: | ---------- |
| **Name of Rider**        |             Name of the rider assigned to deliver this order              | Dropdown   |
| **Price with Rider (₦)** |             Delivery fee agreed with the rider for this order             | Number     |
| **Land Mark**            |                Land mark locations in Lagos and Ogun state                | Dropdown   |
| **Payment by Merchant**  |                                                                           | Auto fill  |
| **Delivery Status**      |      Outcome of delivery: Delivered / Returned / Failed / Cancelled       | Dropdown   |
| **Payment Method**       | How payment was received: Cash / Transfer / PBD (Payment Before Delivery) | Dropdown   |
| **Comment**              |                                                                           | text       |

| \!  | Note: Each order row has its own Submit button. The FOM must click Submit after filling in all fields for that order. This saves the record and pushes the payment data to the accounting dashboard. |
| :-: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**4.3 Delivery Status Options**

| Status        |               Meaning               |         Required Fields Before Submitting          |
| :------------ | :---------------------------------: | :------------------------------------------------: |
| **Delivered** |     Customer received and paid      |    Rider Name, Price with Rider, Payment Method    |
| **Returned**  |       Rider brought item back       | Rider Name, Price with Rider, reason if applicable |
| **Failed**    | Delivery attempted but unsuccessful | Rider Name, Price with Rider, reason if applicable |
| **Cancelled** |   Order cancelled before dispatch   |                 Reason (optional)                  |

| \!  | Note: Fleet operator managers can submit order so it can be saved, but the submitted column cannot be edited. The admin can edit columns but it will have an edited tags to make the CEO know of a change when need be. |
| :-: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Module 04 Accounting Department _Payment confirmation and financial reconciliation_ |
| :---------------------------------------------------------------------------------: |

**5.1 Purpose**

The Accounting dashboard receives all delivered orders from the FOM module. The accountant’s job is to confirm that payment has been received and to record which bank account it landed in.

Accounting does not enter or modify any order data. Their role is purely confirmatory.

**5.2 Accounting Dashboard Fields**

The following fields are visible to accounting. Only the last three are writable by them:

| Field                       |                     Description                      | Editable by Accounting? |
| :-------------------------- | :--------------------------------------------------: | :---------------------: |
| **Customer Name**           |                    From CC entry                     |     No — Read Only      |
| **Product Name**            |                    From CC entry                     |     No — Read Only      |
| **Quantity**                |                    From CC entry                     |     No — Read Only      |
| **Order Amount (₦)**        |                    From CC entry                     |     No — Read Only      |
| **Payment Method**          |          Cash / Transfer / PBD — set by FOM          |     No — Read Only      |
| **Payment by Merchant (₦)** |                      Set by FOM                      |     No — Read Only      |
| **Confirmed**               |         Has payment been verified? Yes / No          |           Yes           |
| **Bank**                    | Which account received the payment: UBA / Moniepoint |           Yes           |

| \!  | Note: Only orders with Delivery Status \= “Delivered” and a Payment Method of Cash or Transfer will appear in the accounting dashboard for confirmation. PDD (paid before delivery) orders may show separately for tracking but do not require the same confirmation workflow. |
| :-: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Module 05 Administrator _Full system control, user management, and reporting_ |
| :---------------------------------------------------------------------------: |

**6.1 Purpose**

The Administrator has unrestricted access to the entire system. This role is held by the operations manager or a trusted senior staff member.

**6.2 Administrator Capabilities**

- Create, edit, and deactivate user accounts for all roles.

- Assign roles to users (CC, Warehouse, FOM1/2/3, Accounting, Admin).

- Manage the merchant list — add, rename, or deactivate merchants.

- View all orders across all departments in a single master table.

- Delete orders (requires a confirmation prompt before action executes).

- Export daily or date-range order reports to CSV or Excel.

- View summary dashboard: total orders, delivery success rate, failed rate, total revenue, fees collected, amounts owed to merchants.

- Reset user passwords.

- Configure system settings: Order ID prefix, session timeout, FOM names.

| \!  | Note: The Administrator is the only role that can delete records, change user roles, or create new accounts. All admin actions are logged with a timestamp and the admin’s name. |
| :-: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**7\. Permissions Master Reference**

The table below is the single source of truth for what each role can see and do across every field in the system.

| Field / Action                         | CC Agent | Warehouse  |   FOM    | Accounting  |  Admin   |
| :------------------------------------- | :------: | :--------: | :------: | :---------: | :------: |
| **Customer Name / Address / Phone**    | **Edit** |  **View**  | **View** |  **View**   | **Full** |
| **Product / Quantity / Amount**        | **Edit** |  **View**  | **View** |  **View**   | **Full** |
| **Merchant**                           | **Edit** |  **View**  |  **—**   |    **—**    | **Full** |
| **CC Comment**                         | **Edit** |  **View**  |  **—**   |    **—**    | **Full** |
| **Delivery Status (Warehouse)**        | **View** | **Update** |  **—**   |    **—**    | **Full** |
| **Inventory Status (Packed/Returned)** |  **—**   | **Update** |  **—**   |    **—**    | **Full** |
| **Assigned To (FOM1/2/3)**             | **View** | **Assign** |  **—**   |    **—**    | **Full** |
| **Warehouse Comment**                  | **View** |  **Edit**  |  **—**   |    **—**    | **Full** |
| **Rider Name**                         |  **—**   |  **View**  | **Edit** |  **View**   | **Full** |
| **Price with Rider (₦)**               |  **—**   |   **—**    | **Edit** |  **View**   | **Full** |
| **Delivery Status (FOM)**              |  **—**   |  **View**  | **Edit** |  **View**   | **Full** |
| **Payment Method**                     |  **—**   |   **—**    | **Edit** |  **View**   | **Full** |
| **Payment Confirmed (Yes/No)**         |  **—**   |   **—**    |  **—**   | **Confirm** | **Full** |
| **Bank (UBA / Moniepoint)**            |  **—**   |   **—**    |  **—**   | **Confirm** | **Full** |
| **Print Waybill**                      |  **—**   |  **Edit**  |  **—**   |    **—**    | **Full** |
| **Delete Orders**                      |  **—**   |   **—**    |  **—**   |    **—**    | **Full** |
| **Manage Users & Merchants**           |  **—**   |   **—**    |  **—**   |    **—**    | **Full** |
| **Export Reports**                     |  **—**   |   **—**    |  **—**   |    **—**    | **Full** |

**8\. Technology Notes**

These are guiding recommendations. The development team should use tools they are most productive with, provided all functional requirements above are met.

| Concern           |                                          Recommendation                                          |
| :---------------- | :----------------------------------------------------------------------------------------------: |
| **Frontend**      |                    Next.js or React — fast, mobile-friendly, component-based                     |
| **Backend / API** |                             Node.js (Express) or Next.js API routes                              |
| **Database**      |        Firebase Firestore (real-time sync built-in) or Supabase (PostgreSQL \+ real-time)        |
| **Auth**          |          Firebase Auth or NextAuth — email/password with role-based session management           |
| **AI Extraction** | Anthropic Claude API (claude-sonnet-4-20250514) — returns structured JSON from pasted order text |
| **Print / PDF**   |    Browser native print dialog or a lightweight PDF library (e.g. jsPDF) for order generation    |
| **Hosting**       |                  Vercel (frontend) \+ Firebase or Supabase (backend & database)                  |
| **Export**        |              SheetJS (xlsx) for CSV / Excel report export from the Admin dashboard               |

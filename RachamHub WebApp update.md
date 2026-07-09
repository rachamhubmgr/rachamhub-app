**RachamHub Limited**

Web Application

*Document of Operation*

**System Update Specification**

Version 2.5 · June 2026 · Internal Use Only

**Module Overview**

| Add Merchant | Stock | Breakdown | Stock Count | Rider to be Paid | Progress report |
| :---: | :---: | :---: | :---: | :---: | :---: |

# **1\.  Objectives**

This document defines the functional update to the RachamHub web application. The update introduces three key capabilities across the Merchant, Stock, and Breakdown modules:

* Identify and register Merchants together with their associated products and pricing; support multiple products per Merchant.

* Record and export per-Merchant, per-product stock-out data.

* Generate, calculate, and export daily breakdown reports for all active Merchants.

# **2\.  Application Modules**

The web application is structured around four primary modules:

* Add Merchant

* Stock

* Breakdown

* Stock Count

# **3\.  Add Merchant Module**

The Add Merchant module is a restricted administrative page accessible only to the Inventory Manager and admin. It serves as the master register for all Merchants and their product catalogues.

## **3.1 Access Control**

**📌 Note:** *This page is a restricted page. It is accessible only by the Inventory Manager & Admin using a secondary access key / password in addition to the standard login credentials.*

## **3.2 Workflow**

### **On First Access (No Merchants in System)**

1. User logs in with standard credentials and secondary access key.

2. User clicks 'Add Merchant' — a modal/pop-up appears with the following input fields:

* Merchant Name

* Product Name

* Product Price

* 'Add Another Product' button (no limit on number of products per Merchant)

3. User saves the Merchant profile. The Merchant is now listed in the system.

### **On Subsequent Logins (Merchants Already in System)**

4. The 'Add Merchant' button remains visible at the top of the page.

5. All previously added Merchants are displayed in a list below the button.

6. To edit a Merchant or their products, the user selects the Merchant, makes the required changes, and saves.

**📌Note:** *There is no limit on the number of products that can be assigned to a single Merchant. The 'Add Product' function must support unlimited entries.*

# **4\.  Stock Module**

The Stock module controls all inbound stock additions and approvals. It operates under a dual-authorization model to ensure stock accuracy and accountability.

## **4.1 Access Levels**

| Role | Login Method | Permissions |
| ----- | ----- | ----- |
| Inventory Manager / Admin | Full credentials \+ Access Key | Add stock; Approve pending entries |
| Regular Warehouse Staff | Guest login (no access key required) | Submit stock entries (Pending status until approved) |
| Customer Service Supervisor | Standard credentials | Co-approver — stock count only goes live after this approval |

## **4.2 Workflow — Inventory Manager/Admin**

7. Log in with full credentials and access key.

8. View all Merchants and select the Merchant in question.

9. Select the product (if multiple products) add stock against a specific product.

10. Submit the stock addition for approval (Customer Service Supervisor).

11. Once approvals are confirmed, the product stock count is updated.

## **4.3 Workflow — Regular Warehouse Staff**

12. Log in as a Guest (no access key required).

13. View all Merchants; and select the Merchant in question. 

14. Select the product (if multiple products) add stock against a specific product.

15. Submission is saved with a 'Pending' status and flagged for approval.

16. Entry is only committed to the live-stock count after approval by both the Inventory Manager and the Customer Service Supervisor.

## **4.4 Additional Stock Logic**

* The system automatically calculates the stock count based on **quantities Added**

* Live stock figures remain visible to authorized users at all times. – Strongly for customer service.

Current stock is 6

Previous stock count 50

6/50

New arrival 15

Updated stock count 6+15 \= 21

21/21 (always refreshing) 

21/75

# **5\.  Breakdown Module**

The Breakdown module provides an automated daily financial summary for every active Merchant. Reports are generated daily and available for export at any time.

## **5.1 Overview**

* A daily breakdown report is produced for each active Merchant.

* The report captures **customer name**, **delivered orders**, **delivery fees**, **amounts paid**, and **total balances**. This would be done for all product that was delivered for a Merchant for a day. Or all merchant at the sometime in a Duc format

* Reports are exportable on demand.

* The breakdown is taken from orders delivered, amount paid and the quantity delivered or failed deliverer, any order that is not tagged from 6:01am to 6:00am the next day will/should be reflected in the next day breakdown. 

## **5.2 Data Entry Process**

**Enter Customer Details**  

Record the following fields for each delivered order:

* Customer Name

* Landmark / Delivery Location

* Delivery Fee (₦)

* Product Name

* Delivery Amount (₦)

* Total amount to pay

## **5.3 Sample Breakdown — Merchant: TOILAD (16/06/2026)**

Delivered Orders:

| Customer | Location / Delivery Fee | Product & Amount |
| ----- | ----- | ----- |
| Kingsley Sunday | Victoria Island — ₦4,000 | 1 Moadop — ₦17,500 |
| Aruoture Dennis | Ibeju Lekki — ₦6,000 | 1 Moadop Tea — ₦17,500 |
| Taiye Fajana | Ikotun — ₦5,000 | 3 Blides Tea — ₦41,500 |
| Noah Idris | Lagos Island — ₦4,000 | 2 Moadop Tea — ₦29,500 |
| Oluwole Oguntayo | Alakuko — ₦5,500 | 1 Blides Tea — ₦17,000 |

Summary:

| Total Order Value | ₦123,000 |
| :---- | ----: |
| Total Delivery Fees | ₦24,500 |
| Total Service Charge | — |
| **Total Balance Payable** | **₦69,000** |

**Example of how the Breakdown will look like.**

| TOILAD ‎16/06/26 Delivered Kingsley sunday Victoria island-4000 1 Moadop \-17,500 Delivered Aruoture Dennis Ibeju lekki-6,000 1 Moadop tea \-17,500 Delivered Taiye fajana Ikotun-5000 3 Blides tea \-41,500 Delivered Noah idris Lagos island-4000 2 Moadop tea \-29,500 Delivered Oluwole oguntayo Alakuko-5,500 1 Blides tea \-17,000 Failed Delivery Sunday Enoch RCCG camp – 3500 1 Moadop tea  \- ‎Total order \=123,000 ‎Total Delivery \=28,000 ‎Total service charge= ‎Total balance= 95,000 ‎Stock count 57 Moadop herbal tea left ‎20 Actimax ‎18 Bildes herbal tea |
| :---- |

## **5.4 Remaining Stock Count (End of Day — TOILAD)**

| Product | Units Remaining |
| ----- | :---: |
| Moadop Herbal Tea | **57** |
| Actimax | **20** |
| Bildes Herbal Tea | **18** |

# **5.5 Failed delivery calculation.**

# Failed delivery is calculated as half of the landmark price, this means if the landmark price is 4,000, when it’s a failed delivery we charge them 2,000.

# 

# 

# **6\. progress Report**

# 

# This is done by getting the record of the total orders sent out, total order delivered, including total failed delivery. This calculation is done for each product. This future is for the customer care department.  This means the customer care personnel will have access to select all the products they want to do progress reports for before click generate for all the report to be done at once.

# 

| MOADOP – *product name* ‎Total order given=11 ‎Total order sent out \=6 ‎Total order delivered \=3 ‎Total failed Delivery \=0 LAGOS DELIVERY Total order given \=6 Total sent out \=6 Total order delivered \=3 Failed delivery \=0 FLOURISH Total order given \=2 Total order sent out \=3 Total delivered \=1 Failed delivery \=0 KARAMI Total order given \=14 Total order sent out= 14 Total order delivered=9 Failed delivery=0 ALIVE Total order given \=2 Total order sent out= 3 Total order delivered=1 Failed delivery=0 ‎Grand Total order received \=35 ‎Grand Total order sent out \=32 ‎Grand Total order delivered \=17 ‎Grand Total Failed Delivery \=0 |
| :---- |

# 

# **7\.  Stock Count Module**

The Stock Count module provides a real-time view of inventory levels across all Merchants. It draws from confirmed stock additions (approved via the Stock module) and subtracts quantities as delivery completions are logged in the Breakdown module.

* Stock count figures update automatically on each approved stock addition.

* Delivery confirmations trigger an automatic deduction from the Merchant's product stock count.

* The module is accessible to all authorized users for viewing; editing requires Inventory Manager credentials.

**8\. Rider to be Paid**	

The rider to be paid is a module that help the FOM personnels to work on the amount of money to pay a rider that they assigned products to. The system will display the Date, Rider name, how many successful deliveries name, the Locations/Landmark, (if any failed deliveries) and Total amount.

**Failed delivery calculation for riders.**

Failed delivery is calculated by paying the rider half of the amount collected from the Marchant.

This means if the Landmark is 4000 for example.

The company charges the Marchant 2000 and the rider gets 1000 for the failed deliveries.

Example of Rider to be Paid.

| COMPANY PAID RIDER'S 23/06/2026  Dare  8 Ikeja, Ikeja, Ikeja, Iyana ipaja, Alakuko, Ijiaye, Ijiaye, Abule Egba. \#15,300 Mr Maxwell 7 Ejigbo, Igando, Ipaja, Ijegun, Isolo, Ikotun, Isheri Oshun. \#12,500 \- 1,000 (outstanding) \- 7,000 \= 4,500  Ayobodun 2 Ikeja, Ikeja  \#3,400 Mr Henry 3 VI, Lekki, VI \#5,400  Mr Tope  5 Magodo, Magodo, Mowe, Mowe, Ikeja. \#11,100  Godiya 2  Ikeja, Ikeja 1,000 paid  Lade 1 Ojota  1,500 Total for Company paid- \#41,200 |
| :---- |

 

# **9\.  Key System Rules & Constraints**

| Rule | Detail |
| ----- | ----- |
| **Unlimited Products per Merchant** | The Add Merchant product entry has no ceiling; additional rows are generated dynamically. |
| **Dual Approval for Stock** | Every stock entry — whether submitted by Manager or Guest staff — requires sign-off by both the Inventory Manager and the Customer Service Supervisor before going live. |
| **Restricted Merchant Page** | The Add Merchant page requires a secondary access key beyond standard login credentials. |
| **Daily Breakdown Automation** | Breakdowns are generated daily per active Merchant and remain available for export indefinitely. |
| **Guest Access for Stock Input** | Regular warehouse staff access the Stock module as Guests and cannot approve their own submissions. |


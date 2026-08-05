import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import MealRequest from '@/models/MealRequest';
import MonthlySummary from '@/models/MonthlySummary';
import Notification from '@/models/Notification';
import HistoryLog from '@/models/HistoryLog';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { month } = await request.json(); // Format: "YYYY-MM"

    if (!month) {
      return NextResponse.json({ success: false, message: 'Missing month parameter' }, { status: 400 });
    }

    // 1. Check if month is already finalized
    const existingSummary = await MonthlySummary.findOne({ month });
    if (existingSummary?.finalized) {
      return NextResponse.json({ success: false, message: `Month ${month} is already finalized` }, { status: 400 });
    }

    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-31`; // string compare safe for YYYY-MM-DD

    // 2. Calculate Total Collection this month
    const totalCollectionResult = await User.aggregate([
      { $match: { role: { $in: ['user', 'cook'] }, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const totalCollection = totalCollectionResult[0]?.total || 0;

    // 3. Calculate Total Points consumed by ALL users this month
    const totalPointsResult = await MealRequest.aggregate([
      { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    const totalPoints = totalPointsResult[0]?.total || 0;

    if (totalPoints === 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot finalize: No meals were consumed in the month of ${month}.` 
      }, { status: 400 });
    }

    // 4. Calculate Point Price
    const pointPrice = totalCollection / totalPoints;

    // 5. Fetch all active users (staff)
    const users = await User.find({ role: 'user', status: 'active' });

    // Loop through each user and calculate costs, update balance, send emails, generate notifications
    for (const user of users) {
      const userMeals = await MealRequest.find({
        userId: user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      let userBreakfasts = 0;
      let userLunches = 0;
      let userDinners = 0;
      let userPoints = 0;

      userMeals.forEach((m) => {
        if (m.breakfast) userBreakfasts++;
        if (m.lunch) userLunches++;
        if (m.dinner) userDinners++;
        userPoints += m.points;
      });

      const userCost = userPoints * pointPrice;
      const originalBalance = user.balance;
      
      // Update User Balance (deduct food cost)
      user.balance = Math.max(0, user.balance - userCost);
      await user.save();

      // Create Notification
      const statementSummary = `Month ${month} finalized. Points: ${userPoints}, Price/Point: Rs.${pointPrice.toFixed(2)}, Cost: Rs.${userCost.toFixed(2)}, Remaining Balance: Rs.${user.balance.toFixed(2)}`;
      await Notification.create({
        userId: user._id,
        title: `Monthly Statement Generated (${month})`,
        message: statementSummary
      });

      // Send Email Notification
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #66BB6A; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="cid:uklogo" alt="UK-Chammery Logo" style="height: 60px; width: auto;" />
          </div>
          <h2 style="color: #1B5E20; text-align: center; border-bottom: 2px solid #66BB6A; padding-bottom: 10px; margin-top: 0;">UK-Chammery Monthly Meal Statement: ${month}</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your meal summary and final balance statement for <strong>${month}</strong> is ready:</p>
          
          <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #A5D6A7;">
                <td style="padding: 6px 0; color: #555;">Breakfast Count:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${userBreakfasts}</td>
              </tr>
              <tr style="border-bottom: 1px solid #A5D6A7;">
                <td style="padding: 6px 0; color: #555;">Lunch Count:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${userLunches}</td>
              </tr>
              <tr style="border-bottom: 1px solid #A5D6A7;">
                <td style="padding: 6px 0; color: #555;">Dinner Count:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${userDinners}</td>
              </tr>
              <tr style="border-bottom: 2px solid #66BB6A;">
                <td style="padding: 6px 0; color: #555; font-weight: bold;">Total Points Used:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #1B5E20;">${userPoints} pts</td>
              </tr>
              <tr style="border-bottom: 1px solid #A5D6A7;">
                <td style="padding: 6px 0; color: #555;">Point Price:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">Rs.${pointPrice.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #A5D6A7;">
                <td style="padding: 6px 0; color: #555; font-weight: bold;">Total Food Cost:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #d32f2f;">Rs.${userCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #555; font-weight: bold;">Remaining Balance:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #1B5E20; font-size: 1.1em;">Rs.${user.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </table>
          </div>
          <p style="text-align: center; font-size: 0.9em; color: #666; margin-top: 20px;">Thank you for using the Smart Office Meal Management System.</p>
        </div>
      `;
      
      await sendEmail({
        to: user.email,
        subject: `Monthly Meal Statement: ${month}`,
        html: emailHtml,
        text: `Hello ${user.name},\n\nYour meal statement for ${month} is ready:\nBreakfast: ${userBreakfasts}\nLunch: ${userLunches}\nDinner: ${userDinners}\nTotal Points: ${userPoints}\nPoint Price: Rs.${pointPrice.toFixed(2)}\nTotal Cost: Rs.${userCost.toFixed(2)}\nRemaining Balance: Rs.${user.balance.toFixed(2)}\n\nThank you.`
      });
    }

    // Reset all cook balances to 0
    await User.updateMany({ role: 'cook' }, { $set: { balance: 0 } });

    // 6. Record or update MonthlySummary
    const summary = await MonthlySummary.findOneAndUpdate(
      { month },
      {
        totalCollection,
        totalPoints,
        pointPrice,
        finalized: true,
        finalizedAt: new Date(),
        finalizedBy: adminId
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 7. Log Action in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Finalize Month',
      details: `Finalized month ${month}. Total Collection: Rs. ${totalCollection}, Total Points: ${totalPoints}, Point Price: Rs. ${pointPrice.toFixed(2)}`
    });

    return NextResponse.json({
      success: true,
      message: `Month ${month} finalized successfully`,
      data: summary
    });
  } catch (error: any) {
    console.error('Finalize month error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MealRequest from '@/models/MealRequest';
import User from '@/models/User';
import Setting from '@/models/Setting';
import Payment from '@/models/Payment';
import MonthlySummary from '@/models/MonthlySummary';
import HistoryLog from '@/models/HistoryLog';
import { getLocalTodayStr, getLocalTomorrowStr, getMonthStr, isPastCutoff } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = getLocalTodayStr();
    const tomorrowStr = getLocalTomorrowStr();
    const currentMonth = getMonthStr(todayStr); // "YYYY-MM"

    // 1. Fetch user profile
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 2. Fetch today's and tomorrow's meal requests
    const todayRequest = await MealRequest.findOne({ userId, date: todayStr });
    const tomorrowRequest = await MealRequest.findOne({ userId, date: tomorrowStr });

    // 3. Fetch meal history for user
    const history = await MealRequest.find({ userId })
      .sort({ date: -1 })
      .limit(50);

    // 4. Fetch cut-off times
    const settings = await Setting.findOne({ key: 'cutoff_times' });
    const cutoffTimes = settings?.value || { breakfast: '07:30', lunch: '10:00', dinner: '18:00' };

    // 5. Aggregate user's monthly stats for the current month
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonth = `${currentMonth}-31`; // Rough bounds, string compare works for YYYY-MM-DD
    
    const userMonthlyMeals = await MealRequest.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;
    let userPointsUsed = 0;

    userMonthlyMeals.forEach((m) => {
      if (m.breakfast) breakfastCount++;
      if (m.lunch) lunchCount++;
      if (m.dinner) dinnerCount++;
      userPointsUsed += m.points;
    });

    // 6. Fetch user's payment for the current month
    const payment = await Payment.findOne({ userId, month: currentMonth });

    // 7. Check if month is finalized
    const monthlySummary = await MonthlySummary.findOne({ month: currentMonth });
    const isFinalized = monthlySummary?.finalized || false;

    let pointPrice = 0;
    let totalMealCost = 0;
    let remainingBalance = user.balance;

    if (isFinalized && monthlySummary) {
      pointPrice = monthlySummary.pointPrice;
      totalMealCost = userPointsUsed * pointPrice;
      // Remaining balance for finalized month is whatever user has left in balance
      remainingBalance = user.balance;
    } else {
      // Estimate Point Price: Total collection / Total points by all users this month
      // Total money collected this month
      const totalCollectionResult = await User.aggregate([
        { $match: { role: 'user', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]);
      const totalCollection = totalCollectionResult[0]?.total || 0;

      // Total points consumed by ALL users this month
      const totalPointsResult = await MealRequest.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      const totalPoints = totalPointsResult[0]?.total || 0;

      // Calculate estimated point price
      pointPrice = totalPoints > 0 ? totalCollection / totalPoints : 0;
      totalMealCost = userPointsUsed * pointPrice;
      
      // Estimated Remaining Balance
      remainingBalance = Math.max(0, user.balance - totalMealCost);
    }

    return NextResponse.json({
      success: true,
      data: {
        today: todayStr,
        currentMonth,
        user: {
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role
        },
        meals: {
          today: todayRequest || { breakfast: false, lunch: false, dinner: false, date: todayStr },
          tomorrow: tomorrowRequest || { breakfast: false, lunch: false, dinner: false, date: tomorrowStr }
        },
        cutoffTimes,
        monthlyStats: {
          breakfast: breakfastCount,
          lunch: lunchCount,
          dinner: dinnerCount,
          points: userPointsUsed,
          pointPrice,
          mealCost: totalMealCost,
          remainingBalance,
          isFinalized
        },
        payment: payment ? { amount: payment.amount, status: payment.status } : null,
        history
      }
    });
  } catch (error: any) {
    console.error('User dashboard fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'User';

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { date, breakfast, lunch, dinner } = await request.json();

    if (!date) {
      return NextResponse.json({ success: false, message: 'Missing date parameter' }, { status: 400 });
    }

    const todayStr = getLocalTodayStr();
    
    // Prevent updating past dates
    if (date < todayStr) {
      return NextResponse.json({ success: false, message: 'Cannot request meals for past dates' }, { status: 400 });
    }

    // Get configured cutoff times
    const settings = await Setting.findOne({ key: 'cutoff_times' });
    const cutoffTimes = settings?.value || { breakfast: '07:30', lunch: '10:00', dinner: '18:00' };

    // Find existing request to know what changed
    const existing = await MealRequest.findOne({ userId, date });
    const oldB = existing?.breakfast || false;
    const oldL = existing?.lunch || false;
    const oldD = existing?.dinner || false;

    // Check cutoff times if editing today's meals
    if (date === todayStr) {
      if (breakfast !== oldB && isPastCutoff(cutoffTimes.breakfast, date)) {
        return NextResponse.json({ success: false, message: `Breakfast cut-off has passed (${cutoffTimes.breakfast} AM)` }, { status: 400 });
      }
      if (lunch !== oldL && isPastCutoff(cutoffTimes.lunch, date)) {
        return NextResponse.json({ success: false, message: `Lunch cut-off has passed (${cutoffTimes.lunch} AM)` }, { status: 400 });
      }
      if (dinner !== oldD && isPastCutoff(cutoffTimes.dinner, date)) {
        return NextResponse.json({ success: false, message: `Dinner cut-off has passed (${cutoffTimes.dinner} PM)` }, { status: 400 });
      }
    }

    // Perform Upsert
    const updatedRequest = await MealRequest.findOneAndUpdate(
      { userId, date },
      { 
        breakfast, 
        lunch, 
        dinner
        // pre-save hook will recalculate the points
      },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    
    // Explicitly call pre-save hook calculations if findOneAndUpdate bypassed it (Mongoose 5/6/7 sometimes bypasses hooks for updates)
    let pts = 0;
    if (updatedRequest.breakfast) pts += 1;
    if (updatedRequest.lunch) pts += 2;
    if (updatedRequest.dinner) pts += 1;
    updatedRequest.points = pts;
    await updatedRequest.save();

    // Log action to History Log
    const actionDetails = `Updated meal requests for ${date}: Breakfast=${breakfast ? 'Yes' : 'No'}, Lunch=${lunch ? 'Yes' : 'No'}, Dinner=${dinner ? 'Yes' : 'No'}`;
    await HistoryLog.create({
      userId,
      action: 'Meal Request Update',
      details: actionDetails
    });

    return NextResponse.json({
      success: true,
      message: 'Meal requests updated successfully',
      data: updatedRequest
    });
  } catch (error: any) {
    console.error('Meal request toggle error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

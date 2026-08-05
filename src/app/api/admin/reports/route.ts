import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import MealRequest from '@/models/MealRequest';
import MonthlySummary from '@/models/MonthlySummary';
import { getLocalTodayStr, getMonthStr } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getMonthStr(getLocalTodayStr());
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'

    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-31`; // string compare safe

    // 1. Fetch Monthly Summary to see if month is finalized and what the point price is
    const summary = await MonthlySummary.findOne({ month });
    const isFinalized = summary?.finalized || false;
    
    let pointPrice = summary?.pointPrice || 0;

    // Fetch payments and points if not finalized, to estimate point price
    if (!isFinalized) {
      const totalCollectionResult = await User.aggregate([
        { $match: { role: 'user', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]);
      const totalCollection = totalCollectionResult[0]?.total || 0;

      const totalPointsResult = await MealRequest.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      const totalPoints = totalPointsResult[0]?.total || 0;
      pointPrice = totalPoints > 0 ? totalCollection / totalPoints : 0;
    }

    // 2. Fetch all staff users
    const users = await User.find({ role: 'user' }).sort({ name: 1 });

    const reportData = [];

    for (const user of users) {
      // Find payments this month
      const payment = await Payment.findOne({ userId: user._id, month });
      const monthlyPayment = payment?.amount || 0;
      const paymentStatus = payment ? payment.status : 'unpaid';

      // Find user meal requests this month
      const userMeals = await MealRequest.find({
        userId: user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      let breakfastCount = 0;
      let lunchCount = 0;
      let dinnerCount = 0;
      let totalPoints = 0;

      userMeals.forEach(m => {
        if (m.breakfast) breakfastCount++;
        if (m.lunch) lunchCount++;
        if (m.dinner) dinnerCount++;
        totalPoints += m.points;
      });

      const totalMealCost = totalPoints * pointPrice;
      const afterBalance = isFinalized ? user.balance + totalMealCost : user.balance;
      const nowBalance = isFinalized ? user.balance : (user.balance - totalMealCost);
      
      reportData.push({
        name: user.name,
        email: user.email,
        monthlyPayment,
        paymentStatus,
        afterBalance,
        breakfastCount,
        lunchCount,
        dinnerCount,
        totalPoints,
        pointPrice,
        totalMealCost,
        nowBalance
      });
    }

    // 3. Export CSV if requested
    if (format === 'csv') {
      const headers = [
        'User Name',
        'This Month Payment (Rs.)',
        'After Balance (Rs.)',
        'Breakfast Count',
        'Lunch Count',
        'Dinner Count',
        'Pts',
        'Cost This Month Total (Rs.)',
        'Now Balance (Rs.)'
      ];

      const csvRows = [headers.join(',')];

      let totalPayments = 0;
      let totalAfterBalance = 0;
      let totalBreakfast = 0;
      let totalLunch = 0;
      let totalDinner = 0;
      let totalPoints = 0;
      let totalCost = 0;
      let totalNowBalance = 0;

      reportData.forEach(row => {
        totalPayments += row.monthlyPayment;
        totalAfterBalance += row.afterBalance;
        totalBreakfast += row.breakfastCount;
        totalLunch += row.lunchCount;
        totalDinner += row.dinnerCount;
        totalPoints += row.totalPoints;
        totalCost += row.totalMealCost;
        totalNowBalance += row.nowBalance;

        const values = [
          `"${row.name.replace(/"/g, '""')}"`,
          row.monthlyPayment,
          row.afterBalance.toFixed(2),
          row.breakfastCount,
          row.lunchCount,
          row.dinnerCount,
          row.totalPoints,
          row.totalMealCost.toFixed(2),
          row.nowBalance.toFixed(2)
        ];
        csvRows.push(values.join(','));
      });

      // Append Totals Row
      const totalsValues = [
        '"TOTALS"',
        totalPayments,
        totalAfterBalance.toFixed(2),
        totalBreakfast,
        totalLunch,
        totalDinner,
        totalPoints,
        totalCost.toFixed(2),
        totalNowBalance.toFixed(2)
      ];
      csvRows.push(totalsValues.join(','));

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=uk-chammery-report-${month}.csv`
        }
      });
    }

    // Return JSON by default
    return NextResponse.json({
      success: true,
      month,
      isFinalized,
      pointPrice,
      reports: reportData
    });
  } catch (error: any) {
    console.error('Reports endpoint error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

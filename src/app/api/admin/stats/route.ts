import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import MealRequest from '@/models/MealRequest';
import { getLocalTodayStr, getMonthStr } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const todayStr = getLocalTodayStr();
    const currentMonth = getMonthStr(todayStr); // "YYYY-MM"
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonth = `${currentMonth}-31`;

    // 1. Basic Stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const userRoleCount = await User.countDocuments({ role: 'user' });

    // 2. Payments stats (Redefined as the total sum of all user balances)
    const totalBalancesResult = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const totalMonthlyCollection = totalBalancesResult[0]?.total || 0;

    // 3. Current Month Meal Counts & Points
    const monthlyMeals = await MealRequest.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let breakfastRequests = 0;
    let lunchRequests = 0;
    let dinnerRequests = 0;
    let totalPoints = 0;

    monthlyMeals.forEach((m) => {
      if (m.breakfast) breakfastRequests++;
      if (m.lunch) lunchRequests++;
      if (m.dinner) dinnerRequests++;
      totalPoints += m.points;
    });

    // 4. Point Price Estimate
    const estimatedPointPrice = totalPoints > 0 ? totalMonthlyCollection / totalPoints : 0;

    // 5. Payment Due accounts
    // Find users of role 'user' who do NOT have a paid record for the current month
    const paidUserIds = await Payment.find({ month: currentMonth, status: 'paid' }).distinct('userId');
    
    const pendingPaymentsCount = await User.countDocuments({
      role: 'user',
      status: 'active',
      _id: { $nin: paidUserIds }
    });

    const dueBalancesCount = await User.countDocuments({
      role: 'user',
      status: 'active',
      balance: { $lte: 0 }
    });

    // 6. Chart: Daily Meal Requests (Last 15 days)
    // Gather last 15 days dates
    const dailyChartData = await MealRequest.aggregate([
      { $match: { date: { $lte: todayStr } } },
      { $sort: { date: -1 } },
      { $limit: 100 }, // Fetch recent requests
      {
        $group: {
          _id: '$date',
          breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
          lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
          dinner: { $sum: { $cond: ['$dinner', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 15 } // Last 15 dates
    ]);

    // 7. Chart: Monthly Point Usage (Last 6 months)
    const monthlyPointData = await MealRequest.aggregate([
      {
        $project: {
          points: 1,
          month: { $substr: ['$date', 0, 7] } // Extract YYYY-MM
        }
      },
      {
        $group: {
          _id: '$month',
          points: { $sum: '$points' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // 8. Chart: Monthly Collections (Last 6 months)
    const monthlyCollectionData = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$month',
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // 9. Chart: User Consumption Ranking (Current Month)
    const userRanking = await MealRequest.aggregate([
      { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: '$userId',
          points: { $sum: '$points' }
        }
      },
      { $sort: { points: -1 } },
      { $limit: 10 }
    ]);

    // Populate user names for ranking
    const populatedRanking = [];
    for (const rank of userRanking) {
      const u = await User.findById(rank._id).select('name');
      if (u) {
        populatedRanking.push({
          name: u.name,
          points: rank.points
        });
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        registeredUsers: totalUsers,
        activeUsers,
        totalMonthlyCollection,
        currentTotalPoints: totalPoints,
        estimatedPointPrice,
        breakfastRequests,
        lunchRequests,
        dinnerRequests,
        pendingPayments: pendingPaymentsCount,
        usersWithDueBalances: dueBalancesCount
      },
      charts: {
        dailyRequests: dailyChartData.map(d => ({
          date: d._id,
          breakfast: d.breakfast,
          lunch: d.lunch,
          dinner: d.dinner
        })),
        monthlyPoints: monthlyPointData.map(m => ({
          month: m._id,
          points: m.points
        })),
        monthlyCollections: monthlyCollectionData.map(m => ({
          month: m._id,
          amount: m.amount
        })),
        userRanking: populatedRanking
      }
    });
  } catch (error: any) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

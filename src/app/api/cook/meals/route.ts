import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MealRequest from '@/models/MealRequest';
import User from '@/models/User';
import { getLocalTodayStr } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || getLocalTodayStr();
    const searchQuery = searchParams.get('search') || '';

    // Fetch meal requests for this date, populate user info
    const requests = await MealRequest.find({ date: dateStr })
      .populate('userId', 'name email status')
      .exec();

    // Filter by search query if active
    let filteredRequests = requests.filter(req => {
      const user = req.userId as any;
      if (!user) return false;
      // Only active users
      if (user.status !== 'active') return false;
      
      if (searchQuery) {
        return user.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    // Bucket into Breakfast, Lunch, and Dinner
    const breakfastList: string[] = [];
    const lunchList: string[] = [];
    const dinnerList: string[] = [];

    filteredRequests.forEach(req => {
      const user = req.userId as any;
      if (req.breakfast) breakfastList.push(user.name);
      if (req.lunch) lunchList.push(user.name);
      if (req.dinner) dinnerList.push(user.name);
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        totals: {
          breakfast: breakfastList.length,
          lunch: lunchList.length,
          dinner: dinnerList.length,
        },
        lists: {
          breakfast: breakfastList,
          lunch: lunchList,
          dinner: dinnerList,
        }
      }
    });
  } catch (error: any) {
    console.error('Cook meals fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

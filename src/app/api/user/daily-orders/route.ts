import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MealRequest from '@/models/MealRequest';
import User from '@/models/User';
import { getLocalTodayStr, getLocalTomorrowStr } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const todayStr = getLocalTodayStr();
    const tomorrowStr = getLocalTomorrowStr();
    
    const getOrdersForDate = async (dateStr: string) => {
      // Fetch meal requests for this date, populate user info
      const requests = await MealRequest.find({ date: dateStr })
        .populate('userId', 'name email status location')
        .exec();

      const breakfastList: string[] = [];
      const lunchList: string[] = [];
      const dinnerList: string[] = [];

      let dinnerStandardCount = 0;
      let dinnerUKCount = 0;
      let dinnerUK2Count = 0;
      let dinnerKadanaCount = 0;

      requests.forEach(req => {
        const user = req.userId as any;
        if (!user || user.status !== 'active') return;

        const guestSuffix = user.location && user.location !== 'none' ? ` (${user.location})` : '';
        const displayName = `${user.name}${guestSuffix}`;

        if (req.breakfast) breakfastList.push(user.name);
        if (req.lunch) lunchList.push(user.name);
        if (req.dinner) {
          dinnerList.push(displayName);
          if (user.location === 'UK Guest') dinnerUKCount++;
          else if (user.location === 'UK Guest 2') dinnerUK2Count++;
          else if (user.location === 'Kadana Guest') dinnerKadanaCount++;
          else dinnerStandardCount++;
        }
      });

      return {
        date: dateStr,
        totals: {
          breakfast: breakfastList.length,
          lunch: lunchList.length,
          dinner: dinnerStandardCount,
          dinnerUK: dinnerUKCount,
          dinnerUK2: dinnerUK2Count,
          dinnerKadana: dinnerKadanaCount
        },
        lists: {
          breakfast: breakfastList,
          lunch: lunchList,
          dinner: dinnerList
        }
      };
    };

    const todayData = await getOrdersForDate(todayStr);
    const tomorrowData = await getOrdersForDate(tomorrowStr);

    return NextResponse.json({
      success: true,
      today: todayData,
      tomorrow: tomorrowData
    });
  } catch (error: any) {
    console.error('Daily orders fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

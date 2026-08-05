import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Notification from '@/models/Notification';
import HistoryLog from '@/models/HistoryLog';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Populate User name/email, and the recorder's name
    const payments = await Payment.find({})
      .populate('userId', 'name email balance status')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error('Admin payments fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { userId, amount, month, notes } = await request.json();

    if (!userId || !amount || !month) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number' }, { status: 400 });
    }

    // 1. Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 2. Create Payment record
    const payment = await Payment.create({
      userId,
      amount: numericAmount,
      month,
      recordedBy: adminId,
      status: 'paid',
      notes
    });

    // 3. Update User Balance
    user.balance += numericAmount;
    await user.save();

    // 4. Create in-app Notification
    const notificationMessage = `Your monthly payment of Rs. ${numericAmount.toLocaleString()} has been received. Your available balance is Rs. ${user.balance.toLocaleString()}.`;
    await Notification.create({
      userId,
      title: 'Payment Received Successfully',
      message: notificationMessage
    });

    const emailSubject = 'Monthly Meal Balance Updated';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #A5D6A7; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="cid:uklogo" alt="UK-Chammery Logo" style="height: 60px; width: auto;" />
        </div>
        <h2 style="color: #1B5E20; text-align: center; border-bottom: 2px solid #66BB6A; padding-bottom: 10px; margin-top: 0;">UK-Chammery Meal Management</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your payment has been received successfully.</p>
        <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="color: #555;">Payment for Month:</td>
              <td style="text-align: right; font-weight: bold;">${month}</td>
            </tr>
            <tr>
              <td style="color: #555;">Monthly Balance:</td>
              <td style="text-align: right; font-weight: bold; color: #1B5E20; font-size: 1.1em;">Rs.${numericAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #555;">Available Balance:</td>
              <td style="text-align: right; font-weight: bold; color: #1B5E20; font-size: 1.1em;">Rs.${user.balance.toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <p style="text-align: center; font-size: 0.9em; color: #666; margin-top: 20px;">Thank you.</p>
      </div>
    `;
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
      text: `Hello ${user.name},\n\nYour payment has been received successfully.\n\nMonthly Balance: Rs.${numericAmount.toLocaleString()}\nAvailable Balance: Rs.${user.balance.toLocaleString()}\n\nThank you.`
    });

    // 6. Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Record Payment',
      details: `Recorded Rs. ${numericAmount} payment for user ${user.name} (${month})`
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { paymentId, amount, notes } = await request.json();

    if (!paymentId || !amount) {
      return NextResponse.json({ success: false, message: 'Missing paymentId or amount' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number' }, { status: 400 });
    }

    // 1. Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    // 2. Find user
    const user = await User.findById(payment.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found for payment' }, { status: 404 });
    }

    // 3. Adjust User Balance by delta
    const delta = numericAmount - payment.amount;
    user.balance += delta;
    await user.save();

    // 4. Update Payment
    const oldAmount = payment.amount;
    payment.amount = numericAmount;
    if (notes !== undefined) payment.notes = notes;
    await payment.save();

    // 5. In-app notification
    const notificationMessage = `Your payment details for month ${payment.month} were updated. Your available balance is Rs. ${user.balance.toLocaleString()}.`;
    await Notification.create({
      userId: user._id,
      title: 'Payment Details Updated',
      message: notificationMessage
    });

    // 6. Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Edit Payment',
      details: `Edited payment for user ${user.name} (${payment.month}). Changed from Rs. ${oldAmount} to Rs. ${numericAmount}`
    });

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      payment
    });
  } catch (error: any) {
    console.error('Update payment error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

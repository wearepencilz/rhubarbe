import { NextRequest, NextResponse } from 'next/server';
import { findMany, insertOne } from '@/lib/db-game';

/**
 * GET /api/game/campaigns
 * Get all campaigns with optional status filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : undefined;

    const campaigns = await findMany('campaigns', {
      where,
      orderBy: { column: 'created_at', direction: 'DESC' },
    });

    return NextResponse.json({
      campaigns,
      total: campaigns.length,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      display_title,
      description,
      status,
      start_date,
      end_date,
      timer_duration,
      reward_total,
      winner_count,
      reward_type,
      reward_description,
      ticket_success_title,
      ticket_success_message,
      level_config,
    } = body;

    // Validate required fields
    if (!name || !status || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['upcoming', 'active', 'paused', 'ended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate timer duration
    if (timer_duration && (timer_duration < 10 || timer_duration > 300)) {
      return NextResponse.json(
        { error: 'Timer duration must be between 10 and 300 seconds' },
        { status: 400 }
      );
    }

    // Validate rewards
    if (reward_total !== undefined && reward_total < 0) {
      return NextResponse.json(
        { error: 'Total rewards cannot be negative' },
        { status: 400 }
      );
    }

    // Validate winner_count
    if (winner_count !== undefined && winner_count < 1) {
      return NextResponse.json(
        { error: 'Winner count must be at least 1' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await insertOne('campaigns', {
      name,
      display_title: display_title || name,
      description: description || null,
      status,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      timer_duration: timer_duration || 60,
      reward_total: reward_total || 0,
      winner_count: winner_count || 100,
      reward_type: reward_type || null,
      reward_description: reward_description || null,
      ticket_success_title: ticket_success_title || null,
      ticket_success_message: ticket_success_message || null,
      level_config: level_config || JSON.stringify({
        platforms: [],
        iceCreams: [],
        spawnPoint: { x: 50, y: 500 },
      }),
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}


/**
 * FUNCTIONAL: Page password management API (CardMass zero-trust)
 * STRATEGIC: Admin-only POST for creation; public PUT for validation with admin bypass
 * WHY: Enables password-protected board sharing while allowing admin access without passwords
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAdminToken } from '@/lib/auth'
import {
  getOrCreatePagePassword,
  validatePagePassword,
  generateShareableLink,
  type PageType,
} from '@/lib/pagePassword'
import { isUUIDv4 } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // WHAT: Check admin authentication via session token
    const token = request.cookies.get('admin_session')?.value;
    const admin = token ? await validateAdminToken(token) : null;
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const pageId = String(body?.pageId || '').trim()
    const pageType = String(body?.pageType || '').trim() as PageType
    const regenerate = !!body?.regenerate

    if (!pageId || !isUUIDv4(pageId)) {
      return NextResponse.json(
        { error: 'pageId must be a valid UUID v4' },
        { status: 400 }
      )
    }

    if (pageType !== 'tagger') {
      return NextResponse.json(
        { error: "pageType must be 'tagger'" },
        { status: 400 }
      )
    }

    const pwDoc = await getOrCreatePagePassword(pageId, pageType, regenerate)

    const protocol =
      request.headers.get('x-forwarded-proto') ||
      (request.url.startsWith('https') ? 'https' : 'http')
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      'localhost:4000'
    const baseUrl = `${protocol}://${host}`

    const organizationUUID = String(body?.organizationUUID || '').trim()
    if (!organizationUUID || !isUUIDv4(organizationUUID)) {
      return NextResponse.json(
        { error: 'organizationUUID must be a valid UUID v4' },
        { status: 400 }
      )
    }

    const link = await generateShareableLink(
      organizationUUID,
      pageId,
      pageType,
      baseUrl,
      pwDoc.password
    )

    return NextResponse.json({
      success: true,
      pagePassword: {
        pageId: pwDoc.pageId,
        pageType: pwDoc.pageType,
        password: pwDoc.password,
        createdAt: pwDoc.createdAt,
        usageCount: pwDoc.usageCount,
      },
      shareableLink: link,
    })
  } catch (error) {
    console.error('[page-passwords POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const pageId = String(body?.pageId || '').trim()
    const pageType = String(body?.pageType || '').trim() as PageType
    const password = String(body?.password || '').trim()

    if (!pageId || !isUUIDv4(pageId)) {
      return NextResponse.json(
        { error: 'pageId must be a valid UUID v4' },
        { status: 400 }
      )
    }

    if (pageType !== 'tagger') {
      return NextResponse.json(
        { error: "pageType must be 'tagger'" },
        { status: 400 }
      )
    }

    // WHAT: Check if request has valid admin session (bypass password check)
    const token = request.cookies.get('admin_session')?.value;
    const admin = token ? await validateAdminToken(token) : null;
    
    if (admin) {
      return NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: true,
        message: 'Admin session accepted',
      })
    }

    if (!password || !/^[0-9a-f]{32}$/.test(password)) {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      )
    }

    const isValid = await validatePagePassword(pageId, pageType, password)

    if (!isValid) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Invalid password' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      isAdmin: false,
      message: 'Page password accepted',
    })
  } catch (error) {
    console.error('[page-passwords PUT] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

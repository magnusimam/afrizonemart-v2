import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { SITE_URL } from '@/lib/seo';
import type { WrappedStatsV1 } from '@/lib/api/wrap';

/**
 * GET /api/wrap/card/[year]/[cardKey]?token=<t>
 *
 * Renders ONE wrap card to a 1080×1920 PNG for sharing. Public but
 * token-gated: the token (minted by the logged-in user's /wrapped
 * page) is exchanged with the API's /api/wrap/shared endpoint for the
 * stats — which only returns them if the wrap is live. The user then
 * shares the PNG file, so the token's short TTL never breaks a posted
 * image.
 *
 * cardKey ∈ personality | geography | cultural | supported |
 *           categories | rewards | care | discoveries | summary
 */
export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1920;
const NAVY = '#000066';
const AMBER = '#FBAC34';
const WHITE = '#FFFFFF';
const SOFT = 'rgba(255,255,255,0.82)';
const MUTED = 'rgba(255,255,255,0.6)';
const LOGO_URL = `${SITE_URL}/images/logo.png`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Per-card backdrop — mirrors the on-screen deck's palette so the
// shared image matches what the user swiped through.
const CARD_BG: Record<string, string> = {
  personality: 'linear-gradient(160deg, #000066 0%, #1A1A8A 60%, #2D2DAA 100%)',
  geography: 'linear-gradient(140deg, #033E5A 0%, #045E76 60%, #07A09D 100%)',
  cultural: 'linear-gradient(160deg, #4A0A4F 0%, #7A1075 50%, #B71D6C 100%)',
  supported: 'linear-gradient(160deg, #11342B 0%, #1A6C42 60%, #2DB07A 100%)',
  categories: 'linear-gradient(160deg, #5B1B05 0%, #8C2F09 60%, #D34F0E 100%)',
  rewards: 'linear-gradient(160deg, #000066 0%, #131388 60%, #1F1FB4 100%)',
  care: 'linear-gradient(160deg, #6B0E0A 0%, #9F1B12 60%, #D9382B 100%)',
  discoveries: 'linear-gradient(160deg, #1F0E40 0%, #3B1F7A 60%, #5733AE 100%)',
  summary: 'linear-gradient(160deg, #000066 0%, #281580 60%, #FBAC34 120%)',
};

const VALID_KEYS = Object.keys(CARD_BG);

async function fetchStats(
  token: string,
): Promise<{ year: number; stats: WrappedStatsV1 } | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(
      `${apiBase}/api/wrap/shared?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return (await res.json()) as { year: number; stats: WrappedStatsV1 };
  } catch {
    return null;
  }
}

// ── Small layout atoms (every multi-child node sets display:flex) ──
function Kicker({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 30,
        letterSpacing: 8,
        textTransform: 'uppercase',
        color: SOFT,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function BigNumber({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', fontSize: 220, fontWeight: 800, color: WHITE, lineHeight: 1 }}>
      {children}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        fontSize: 34,
        color: SOFT,
        borderTop: '1px solid rgba(255,255,255,0.18)',
        paddingTop: 18,
        marginTop: 18,
      }}
    >
      <div style={{ display: 'flex', fontWeight: 600, color: WHITE }}>{left}</div>
      <div style={{ display: 'flex' }}>{right}</div>
    </div>
  );
}

function cardBody(key: string, stats: WrappedStatsV1): React.ReactNode {
  switch (key) {
    case 'personality':
      return (
        <>
          <Kicker>You are a</Kicker>
          <div style={{ display: 'flex', fontSize: 130, fontWeight: 800, color: WHITE, lineHeight: 1, marginTop: 20 }}>
            {stats.personality}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: SOFT, marginTop: 28, maxWidth: 760, lineHeight: 1.3 }}>
            {stats.personalityReason}
          </div>
        </>
      );
    case 'geography':
      return (
        <>
          <Kicker>You shopped from</Kicker>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 10 }}>
            <BigNumber>{String(stats.uniqueCountriesCount)}</BigNumber>
            <div style={{ display: 'flex', fontSize: 44, color: SOFT }}>countries</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 30 }}>
            {stats.topOriginCountries.slice(0, 3).map((c) => (
              <Row key={c.code} left={c.name} right={`${c.sharePct}%`} />
            ))}
          </div>
        </>
      );
    case 'cultural':
      return (
        <>
          <Kicker>Your cultural year</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 24 }}>
            <Row left="Christmas week" right={`${stats.cultural.christmasWeekOrders} orders`} />
            <Row left="Independence Day" right={`${stats.cultural.independenceDayWeekOrders} orders`} />
            <Row left="Eid week" right={`${stats.cultural.eidWeekOrders} orders`} />
            <Row left="Busiest month" right={MONTHS[stats.cultural.busiestMonth.month - 1] ?? '—'} />
          </div>
        </>
      );
    case 'supported':
      return (
        <>
          <Kicker>Your orders supported</Kicker>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 10 }}>
            <BigNumber>{String(stats.smallBusinessesSupported)}</BigNumber>
          </div>
          <div style={{ display: 'flex', fontSize: 44, color: SOFT, marginTop: 6 }}>
            small businesses across Africa
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 26 }}>
            {stats.topSellers.slice(0, 3).map((s) => (
              <Row key={s.brand} left={s.brand} right={s.country ?? ''} />
            ))}
          </div>
        </>
      );
    case 'categories': {
      const top = stats.topCategories[0];
      return (
        <>
          <Kicker>Your favourite category</Kicker>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: WHITE, marginTop: 18, lineHeight: 1.05, maxWidth: 820 }}>
            {top?.name ?? '—'}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: AMBER, marginTop: 14 }}>
            {top?.sharePct ?? 0}% of your orders
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 26 }}>
            {stats.topCategories.slice(1, 4).map((c) => (
              <Row key={c.slug} left={c.name} right={`${c.sharePct}%`} />
            ))}
          </div>
        </>
      );
    }
    case 'rewards':
      return (
        <>
          <Kicker>You earned</Kicker>
          <BigNumber>{stats.loyalty.coinsEarned.toLocaleString()}</BigNumber>
          <div style={{ display: 'flex', fontSize: 44, color: SOFT, marginTop: 6 }}>Afrizone Coins</div>
          <div style={{ display: 'flex', marginTop: 36, padding: '18px 40px', borderRadius: 999, backgroundColor: AMBER, color: NAVY, fontSize: 40, fontWeight: 800, letterSpacing: 4 }}>
            {stats.loyalty.finalTier} TIER
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: MUTED, marginTop: 24 }}>
            Top {Math.max(1, 100 - stats.loyalty.percentileRank)}% of shoppers
          </div>
        </>
      );
    case 'care':
      return (
        <>
          <Kicker>You sent</Kicker>
          <BigNumber>{String(stats.carePackagesCount)}</BigNumber>
          <div style={{ display: 'flex', fontSize: 44, color: SOFT, marginTop: 6 }}>
            care package{stats.carePackagesCount === 1 ? '' : 's'} home
          </div>
          <div style={{ display: 'flex', fontSize: 36, color: MUTED, marginTop: 40, fontStyle: 'italic', maxWidth: 760, lineHeight: 1.3 }}>
            Distance is nothing for the ones we love.
          </div>
        </>
      );
    case 'discoveries':
      return (
        <>
          <Kicker>You were early to</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 24, gap: 22 }}>
            {stats.discoveries.slice(0, 3).map((d) => (
              <div key={d.productSlug} style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '24px 28px', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: WHITE }}>{d.productName}</div>
                <div style={{ display: 'flex', fontSize: 28, color: SOFT, marginTop: 8 }}>{d.why}</div>
              </div>
            ))}
          </div>
        </>
      );
    case 'summary':
    default:
      return (
        <>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, color: WHITE, lineHeight: 1.1, maxWidth: 840 }}>
            Thanks for an amazing year
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 36 }}>
            <Row left="Orders" right={String(stats.totalOrders)} />
            <Row left="Products" right={String(stats.totalProducts)} />
            <Row left="Countries" right={String(stats.uniqueCountriesCount)} />
          </div>
        </>
      );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { year: string; cardKey: string } },
) {
  const cardKey = VALID_KEYS.includes(params.cardKey) ? params.cardKey : null;
  if (!cardKey) return new Response('Unknown card', { status: 404 });

  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) return new Response('Missing token', { status: 401 });

  const data = await fetchStats(token);
  if (!data) return new Response('Wrap not available', { status: 404 });

  const { year, stats } = data;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '90px 80px',
          backgroundImage: CARD_BG[cardKey],
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo pill, top-left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            padding: '10px 18px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="" width={260} height={70} style={{ width: 260, height: 70, objectFit: 'contain' }} />
        </div>

        {/* Card body — centered block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {cardBody(cardKey, stats)}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: SOFT,
          }}
        >
          <div style={{ display: 'flex' }}>Afrizonemart Wrap</div>
          <div style={{ display: 'flex' }}>{year}</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=600',
      },
    },
  );
}

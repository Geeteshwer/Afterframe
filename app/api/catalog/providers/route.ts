import { secret, failure } from '@/lib/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return failure(new Error('Invalid movie ID'), 400);

  const token = secret('TMDB_READ_TOKEN');
  if (!token) return Response.json({ status: 'Availability not confirmed', providers: [], link: '' });

  try {
    const [providersRes, datesRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000)
      }),
      fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000)
      })
    ]);

    let providersData: any = {};
    let datesData: any = {};
    if (providersRes.ok) providersData = await providersRes.json();
    if (datesRes.ok) datesData = await datesRes.json();

    const inProviders = providersData.results?.IN || {};
    const link = inProviders.link || '';
    
    // Aggregate providers
    const providersMap = new Map();
    const addProviders = (list: any[], type: string) => {
      if (!list) return;
      for (const p of list) {
        if (!providersMap.has(p.provider_id)) {
          providersMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: `https://image.tmdb.org/t/p/original${p.logo_path}`,
            types: [type]
          });
        } else {
          providersMap.get(p.provider_id).types.push(type);
        }
      }
    };

    addProviders(inProviders.flatrate, 'flatrate');
    addProviders(inProviders.free, 'free');
    addProviders(inProviders.ads, 'ads');
    addProviders(inProviders.rent, 'rent');
    addProviders(inProviders.buy, 'buy');

    const providers = Array.from(providersMap.values());
    const streamers = providers.filter(p => p.types.includes('flatrate') || p.types.includes('free') || p.types.includes('ads'));
    const rentBuy = providers.filter(p => p.types.includes('rent') || p.types.includes('buy'));

    // Find India release dates
    const inDates = datesData.results?.find((r: any) => r.iso_3166_1 === 'IN');
    let theatricalDate: Date | null = null;
    let digitalDate: Date | null = null;

    if (inDates && inDates.release_dates) {
      for (const rd of inDates.release_dates) {
        // TMDB Types: 1=Premiere, 2=Theatrical (limited), 3=Theatrical, 4=Digital, 5=Physical, 6=TV
        if (rd.type === 2 || rd.type === 3) {
          const d = new Date(rd.release_date);
          if (!theatricalDate || d < theatricalDate) theatricalDate = d;
        }
        if (rd.type === 4) {
          const d = new Date(rd.release_date);
          if (!digitalDate || d < digitalDate) digitalDate = d;
        }
      }
    }

    const now = new Date();
    let statusText = 'Availability not confirmed';

    if (streamers.length > 0) {
      const names = streamers.map(s => s.name).slice(0, 2).join(', ') + (streamers.length > 2 ? ` +${streamers.length - 2}` : '');
      statusText = `Streaming on ${names}`;
    } else if (rentBuy.length > 0) {
      statusText = 'Available to rent or buy';
    } else if (theatricalDate) {
      if (theatricalDate <= now) {
        statusText = 'Now in theatres';
      } else {
        statusText = `Coming to theatres on ${theatricalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else if (digitalDate && digitalDate > now) {
      statusText = `Coming digitally on ${digitalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    return new Response(JSON.stringify({ status: statusText, providers, link }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (e) {
    return failure(new Error('Availability service unavailable'), 502);
  }
}

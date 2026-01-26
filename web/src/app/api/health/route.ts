import { NextResponse } from 'next/server';

interface MemoryInfo {
  used: number;
  total: number;
  external: number;
  rss: number;
}

interface EnvironmentInfo {
  nodeVersion: string;
  platform: NodeJS.Platform;
  arch: string;
}

interface ServiceStatus {
  status: string;
  responseCode?: number;
  lastChecked: string;
  error?: string;
}

interface ServiceChecks {
  stripe: {
    configured: boolean;
    status: string;
  };
  mediapipe: ServiceStatus;
  environment: {
    baseUrl: boolean;
    stripePublishableKey: boolean;
    nodeEnv: string;
  };
}

interface HealthChecks {
  timestamp: string;
  uptime: number;
  memory: MemoryInfo;
  environment: EnvironmentInfo;
  services: ServiceChecks;
  responseTime: number;
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Perform health checks
    const checks: HealthChecks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      services: await performServiceChecks(),
      responseTime: 0, // Will be set below
    };

    const responseTime = Date.now() - startTime;
    checks.responseTime = responseTime;

    // Determine overall health status
    const isHealthy = determineHealthStatus(checks);
    const status = isHealthy ? 'healthy' : 'degraded';
    const httpStatus = isHealthy ? 200 : 503;

    return NextResponse.json(
      {
        status,
        ...checks,
      },
      {
        status: httpStatus,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

async function performServiceChecks(): Promise<ServiceChecks> {
  // Check Stripe configuration
  const stripe = {
    configured: !!process.env.STRIPE_SECRET_KEY,
    status: process.env.STRIPE_SECRET_KEY ? 'available' : 'not_configured',
  };

  // Check external CDN dependencies
  const mediapipe = await checkExternalService(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
  );

  // Check if required environment variables are set
  const environment = {
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    nodeEnv: process.env.NODE_ENV || 'unknown',
  };

  return { stripe, mediapipe, environment };
}

async function checkExternalService(url: string): Promise<ServiceStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseCode: response.status,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

function determineHealthStatus(checks: HealthChecks): boolean {
  // Check memory usage - fail if using more than 90% of heap
  const memoryUsagePercent = (checks.memory.used / checks.memory.total) * 100;
  if (memoryUsagePercent > 90) {
    return false;
  }

  // Check response time - fail if over 5 seconds
  if (checks.responseTime > 5000) {
    return false;
  }

  // Check if critical services are healthy
  if (checks.services.mediapipe?.status === 'unhealthy') {
    return false;
  }

  return true;
}

// Simple readiness check
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

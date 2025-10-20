import { useState, useEffect, useCallback, useRef } from 'react';

// Mobile detection and device info
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
  platform: 'ios' | 'android' | 'web';
  userAgent: string;
}

export const useMobileDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenSize: 'lg',
        orientation: 'landscape',
        hasTouch: false,
        platform: 'web',
        userAgent: ''
      };
    }

    const userAgent = navigator.userAgent;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Screen size detection
    let screenSize: DeviceInfo['screenSize'] = 'lg';
    if (width < 640) screenSize = 'xs';
    else if (width < 768) screenSize = 'sm';
    else if (width < 1024) screenSize = 'md';
    else if (width < 1280) screenSize = 'lg';
    else if (width < 1536) screenSize = 'xl';
    else screenSize = '2xl';

    // Device type detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                     (hasTouch && width <= 768);
    const isTablet = /iPad|Android/i.test(userAgent) && width >= 768 && width <= 1024;
    const isDesktop = !isMobile && !isTablet;

    // Platform detection
    let platform: DeviceInfo['platform'] = 'web';
    if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'ios';
    else if (/Android/i.test(userAgent)) platform = 'android';

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenSize,
      orientation: width > height ? 'landscape' : 'portrait',
      hasTouch,
      platform,
      userAgent
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let screenSize: DeviceInfo['screenSize'] = 'lg';
      if (width < 640) screenSize = 'xs';
      else if (width < 768) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else if (width < 1536) screenSize = 'xl';
      else screenSize = '2xl';

      setDeviceInfo(prev => ({
        ...prev,
        screenSize,
        orientation: width > height ? 'landscape' : 'portrait'
      }));
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// Touch gesture handling
export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface TouchGestureOptions {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultSwipe?: boolean;
  onSwipe?: (swipe: SwipeDirection) => void;
  onTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  longPressDuration?: number;
}

export const useTouchGestures = (
  ref: React.RefObject<HTMLElement>,
  options: TouchGestureOptions = {}
) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 1000,
    preventDefaultSwipe = true,
    onSwipe,
    onTap,
    onLongPress,
    longPressDuration = 500
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(event);
      }, longPressDuration);
    }
  }, [onLongPress, longPressDuration]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (preventDefaultSwipe && touchStartRef.current) {
      event.preventDefault();
    }
  }, [preventDefaultSwipe]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for tap
    if (distance < 10 && deltaTime < 200 && onTap) {
      onTap(event);
      return;
    }

    // Check for swipe
    if (distance >= minSwipeDistance && deltaTime <= maxSwipeTime && onSwipe) {
      let direction: SwipeDirection['direction'];
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const velocity = distance / deltaTime;

      onSwipe({
        direction,
        distance,
        velocity,
        duration: deltaTime
      });
    }

    touchStartRef.current = null;
  }, [minSwipeDistance, maxSwipeTime, onSwipe, onTap]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isGestureActive: touchStartRef.current !== null
  };
};

// Mobile-optimized viewport hook
export const useMobileViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    safeArea: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Get safe area insets for mobile devices
      const computedStyle = getComputedStyle(document.documentElement);
      const safeArea = {
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      };

      setViewport({ width, height, safeArea });
    };

    // Set initial viewport
    updateViewport();

    // Update viewport on resize and orientation change
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', () => {
      // Delay to get correct dimensions after orientation change
      setTimeout(updateViewport, 100);
    });

    // Set viewport meta tag for proper mobile scaling
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
};

// Responsive breakpoints hook
export const useBreakpoint = () => {
  const deviceInfo = useMobileDetection();
  
  const breakpoints = {
    xs: deviceInfo.screenSize === 'xs',
    sm: deviceInfo.screenSize === 'sm',
    md: deviceInfo.screenSize === 'md',
    lg: deviceInfo.screenSize === 'lg',
    xl: deviceInfo.screenSize === 'xl',
    '2xl': deviceInfo.screenSize === '2xl',
    mobile: deviceInfo.isMobile,
    tablet: deviceInfo.isTablet,
    desktop: deviceInfo.isDesktop,
    touch: deviceInfo.hasTouch
  };

  return breakpoints;
};

// Mobile performance optimization
export const useMobilePerformance = () => {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'battery'>('balanced');
  const deviceInfo = useMobileDetection();

  useEffect(() => {
    // Auto-detect performance mode based on device capabilities
    if (deviceInfo.isMobile) {
      const isLowEnd = window.innerWidth <= 414 || 
                      navigator.hardwareConcurrency <= 2 ||
                      (navigator as any).deviceMemory <= 2;
      
      if (isLowEnd) {
        setPerformanceMode('battery');
      } else {
        setPerformanceMode('balanced');
      }
    } else {
      setPerformanceMode('high');
    }
  }, [deviceInfo]);

  const getOptimizedSettings = useCallback(() => {
    switch (performanceMode) {
      case 'battery':
        return {
          animationsEnabled: false,
          autoRefreshInterval: 10000, // 10 seconds
          chartUpdatesPerSecond: 1,
          maxVisibleOrderBookEntries: 20,
          useVirtualScrolling: true,
          preloadImages: false
        };
      case 'balanced':
        return {
          animationsEnabled: true,
          autoRefreshInterval: 5000, // 5 seconds
          chartUpdatesPerSecond: 2,
          maxVisibleOrderBookEntries: 50,
          useVirtualScrolling: true,
          preloadImages: false
        };
      case 'high':
        return {
          animationsEnabled: true,
          autoRefreshInterval: 1000, // 1 second
          chartUpdatesPerSecond: 10,
          maxVisibleOrderBookEntries: 100,
          useVirtualScrolling: false,
          preloadImages: true
        };
    }
  }, [performanceMode]);

  return {
    performanceMode,
    setPerformanceMode,
    settings: getOptimizedSettings(),
    isLowPerformanceDevice: performanceMode === 'battery'
  };
};

// Progressive Web App utilities
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    setInstallPrompt(null);
    setIsInstallable(false);

    return result.outcome === 'accepted';
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};
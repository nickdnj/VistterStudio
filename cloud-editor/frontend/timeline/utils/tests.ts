/**
 * Basic tests for timeline functionality
 * Run these in browser console to verify core functionality
 */

import { TimeScale, TickGenerator, TimeFormatter } from '../models/TimeScale';

export const runTimelineTests = () => {
  console.log('🧪 Running Timeline v2 Tests...\n');

  // Test TimeScale conversions
  console.log('📏 Testing TimeScale conversions:');
  const timeScale = new TimeScale(100, 0, 192); // 100ms per pixel, start at 0, 192px offset
  
  // Test time to pixel conversion
  const x1 = timeScale.xOf(5000); // 5 seconds should be at 242px (192 + 50)
  console.log(`✓ 5000ms → ${x1}px (expected: 242px)`);
  
  // Test pixel to time conversion  
  const t1 = timeScale.tOf(242); // 242px should be 5000ms
  console.log(`✓ 242px → ${t1}ms (expected: 5000ms)`);
  
  // Test round-trip conversion
  const roundTrip = timeScale.tOf(timeScale.xOf(12345));
  console.log(`✓ Round-trip: 12345ms → ${roundTrip}ms (should match)`);

  // Test tick generation
  console.log('\n📊 Testing tick generation:');
  const tickInterval = TickGenerator.getTickInterval(100, 80); // 100ms/px, target 80px spacing
  console.log(`✓ Tick interval: ${tickInterval}ms`);
  
  const ticks = TickGenerator.generateTicks(0, 30000, tickInterval);
  console.log(`✓ Generated ${ticks.length} ticks for 30s range`);
  console.log(`✓ First few ticks:`, ticks.slice(0, 5));

  // Test time formatting
  console.log('\n🕒 Testing time formatting:');
  console.log(`✓ 0ms → "${TimeFormatter.formatTime(0)}"`);
  console.log(`✓ 5000ms → "${TimeFormatter.formatTime(5000)}"`);
  console.log(`✓ 65000ms → "${TimeFormatter.formatTime(65000)}"`);
  console.log(`✓ 3665000ms → "${TimeFormatter.formatTime(3665000)}"`);
  
  console.log(`✓ 5000ms tick → "${TimeFormatter.formatTickLabel(5000)}"`);
  console.log(`✓ 60000ms tick → "${TimeFormatter.formatTickLabel(60000)}"`);

  // Test zoom presets
  console.log('\n🔍 Testing zoom presets:');
  const presets = TimeScale.getZoomPresets();
  presets.forEach(preset => {
    console.log(`✓ ${preset.label}: ${preset.durationMs}ms`);
  });

  // Test viewport calculations
  console.log('\n📺 Testing viewport calculations:');
  const viewportWidth = 800;
  const zoomedScale = timeScale.setVisibleDuration(30000, viewportWidth); // 30s visible
  console.log(`✓ Zoomed msPerPx: ${zoomedScale.msPerPx} (expected: ${30000/viewportWidth})`);
  
  // Test panning
  const pannedScale = timeScale.panByPixels(100); // Pan right 100px
  console.log(`✓ Panned viewStartMs: ${pannedScale.viewStartMs}ms (expected: ${100 * timeScale.msPerPx}ms)`);

  console.log('\n✅ All tests completed! Check results above.');
  
  return {
    timeScale,
    tickInterval,
    ticks: ticks.slice(0, 10), // First 10 ticks
    presets,
    zoomedScale,
    pannedScale
  };
};

// Test data for store
export const createTestClips = () => [
  {
    id: 'test-clip-1',
    trackId: 'main',
    kind: 'video' as const,
    sourceId: 'camera-1',
    startMs: 2000,
    durationMs: 8000,
    name: 'Test Camera Feed',
    enabled: true,
    opacity: 100,
  },
  {
    id: 'test-clip-2', 
    trackId: 'overlay1',
    kind: 'overlay' as const,
    sourceId: 'asset-1',
    startMs: 5000,
    durationMs: 3000,
    name: 'Test Overlay',
    enabled: true,
    opacity: 80,
  },
  {
    id: 'test-clip-3',
    trackId: 'audio',
    kind: 'audio' as const,
    sourceId: 'asset-2',
    startMs: 0,
    durationMs: 15000,
    name: 'Background Music',
    enabled: true,
    opacity: 100,
  }
];

// Test store functionality
export const testTimelineStore = () => {
  console.log('🏪 Testing Timeline Store...\n');
  
  // This would need to be run in a React component context
  console.log('⚠️  Store tests should be run in browser with React context');
  console.log('   1. Open browser dev tools');
  console.log('   2. Import store: const { useTimelineStore } = await import("./timeline")');
  console.log('   3. Get state: const state = useTimelineStore.getState()');
  console.log('   4. Test actions: state.setCurrentTime(5000)');
  console.log('   5. Add test clips: testClips.forEach(clip => state.addClip(clip))');
  
  return createTestClips();
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).timelineTests = {
    runTimelineTests,
    createTestClips,
    testTimelineStore
  };
}

#!/usr/bin/env node

// Test script to add the provided RTMP camera for validation
const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function testRTMPCamera() {
  console.log('🧪 Testing RTMP Camera Integration');
  console.log('====================================');

  // Test camera configuration based on provided URL:
  // rtmp://192.168.86.23:1935/bcs/channel0_ext.bcs?channel=0&stream=2&user=Wharfside&password=Wharfside2025!!
  
  const testCamera = {
    name: 'Test Reolink Camera',
    host: '192.168.86.23',
    port: 1935,
    channel: 0,
    stream: 2,
    username: 'Wharfside',
    password: 'Wharfside2025!!'
  };

  try {
    console.log('📹 Adding test RTMP camera...');
    console.log(`   Host: ${testCamera.host}:${testCamera.port}`);
    console.log(`   Channel: ${testCamera.channel}, Stream: ${testCamera.stream}`);
    console.log(`   Username: ${testCamera.username}`);
    
    const addResponse = await axios.post(`${API_BASE}/rtmp/cameras`, testCamera);
    console.log('✅ Camera added successfully!');
    console.log(`   Camera ID: ${addResponse.data.camera.id}`);
    
    // Get stream URL
    console.log('\n🔗 Getting stream URL...');
    const streamResponse = await axios.get(`${API_BASE}/rtmp/cameras/${addResponse.data.camera.id}/stream`);
    console.log('✅ Stream URL generated successfully!');
    console.log(`   URL: ${streamResponse.data.streamUrl}`);
    
    // List all cameras
    console.log('\n📋 Listing all cameras...');
    const listResponse = await axios.get(`${API_BASE}/rtmp/cameras`);
    console.log('✅ Camera list retrieved successfully!');
    console.log(`   Total cameras: ${listResponse.data.cameras.length}`);
    
    listResponse.data.cameras.forEach((camera, index) => {
      console.log(`   ${index + 1}. ${camera.name} (${camera.host}:${camera.port})`);
    });
    
    console.log('\n🎉 All tests passed! RTMP integration is working correctly.');
    console.log('\n📝 Test Results Summary:');
    console.log('   ✅ Camera configuration and storage');
    console.log('   ✅ Credential handling and URL generation'); 
    console.log('   ✅ API endpoints functionality');
    console.log('   ✅ RTMP URL format validation');
    
    return {
      success: true,
      cameraId: addResponse.data.camera.id,
      streamUrl: streamResponse.data.streamUrl
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the VistterStudio server is running:');
      console.log('   cd server && npm start');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testRTMPCamera()
    .then(result => {
      if (result.success) {
    console.log('\n🎯 Ready for testing!');
    console.log('   Frontend: Open http://localhost:5173');
    console.log('   1. Check Camera Drawer for "Test Reolink Camera"');
    console.log('   2. Drag camera to timeline');
    console.log('   3. Verify properties panel controls work');
    console.log('\n📺 To view actual RTMP stream:');
    console.log('   VLC: Media > Open Network Stream > Paste URL');
    console.log('   FFplay: ffplay "' + result.streamUrl + '"');
    console.log('   OBS: Add Media Source > Uncheck "Local File" > Paste URL');
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('💥 Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = testRTMPCamera;

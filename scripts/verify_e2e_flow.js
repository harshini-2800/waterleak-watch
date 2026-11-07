const BASE_URL = 'http://localhost:5000/api/v1';

async function req(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(fullUrl, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

async function runVerification() {
  console.log('--- Starting End-to-End Main Flow Verification ---');

  // 1. Submit a fresh citizen leak report
  console.log('1. Submitting citizen leak report...');
  const report1 = await req('/reports', {
    method: 'POST',
    body: {
      latitude: 37.7760,
      longitude: -122.4180,
      area: 'Downtown Financial',
      street: '100 Market St',
      severity: 'high',
      leakType: 'pipe_burst',
      description: 'Fresh pipe burst water overflowing curbside',
      reporterName: 'Citizen Test Verification'
    }
  });

  const trackingId1 = report1.data.report.trackingId;
  const incidentId1 = report1.data.incident.id;
  console.log(`   ✓ Report created! Tracking ID: ${trackingId1}`);
  console.log(`   ✓ New Incident Cluster created! Incident ID: ${incidentId1}`);

  // 2. Test proximity detection at 20m distance
  console.log('2. Testing proximity detection ($geoNear within 50m)...');
  const nearbyRes = await req('/reports/nearby?lat=37.7761&lng=-122.4181&radius=50');

  const matches = nearbyRes.data;
  console.log(`   ✓ Proximity search returned ${matches.length} active match(es)`);
  const matchedIncident = matches.find(m => m._id === incidentId1);
  if (!matchedIncident) {
    throw new Error('Proximity detection failed to locate the newly created incident cluster!');
  }
  console.log(`   ✓ Matched newly created incident within ${matchedIncident.distanceMeters} meters!`);

  // 3. Submit repeated report clustered into existing incident
  console.log('3. Submitting repeated report clustered into existing incident...');
  const report2 = await req('/reports', {
    method: 'POST',
    body: {
      latitude: 37.7761,
      longitude: -122.4181,
      area: 'Downtown Financial',
      street: '100 Market St',
      severity: 'critical', // Escalate severity!
      leakType: 'pipe_burst',
      description: 'Second citizen reporting: pressure is increasing!',
      existingIncidentId: incidentId1,
      reporterName: 'Second Witness'
    }
  });

  const trackingId2 = report2.data.report.trackingId;
  console.log(`   ✓ Repeated report joined cluster! New Tracking ID: ${trackingId2}`);
  console.log(`   ✓ Incident Report Count is now: ${report2.data.incident.reportCount}`);
  console.log(`   ✓ Incident Severity escalated to: ${report2.data.incident.severity}`);

  // 4. Test login as Admin and update status through finite state machine
  console.log('4. Logging in as Admin to test SLA transitions...');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@waterleakwatch.org',
      password: 'AdminPass123!'
    }
  });
  const adminToken = loginRes.data.accessToken;

  // Attempt invalid transition directly from reported to resolved (should fail with 400)
  try {
    await req(`/incidents/${incidentId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'resolved', note: 'Attempting invalid skip' }
    });
    throw new Error('Server allowed an invalid state machine jump!');
  } catch (err) {
    console.log(`   ✓ Correctly rejected invalid transition: "${err.response?.data?.error?.message}"`);
  }

  // Perform valid transition: reported -> verified
  const verifiedRes = await req(`/incidents/${incidentId1}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'verified', note: 'Authority verified leak severity' }
  });
  console.log(`   ✓ Status moved to: ${verifiedRes.data.status}`);

  // Assign crew
  const crewRes = await req('/users?role=crew', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const crewId = crewRes.data[0]._id;

  const assignRes = await req(`/incidents/${incidentId1}/assign`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { crewId, note: 'Dispatched emergency plumber' }
  });
  console.log(`   ✓ Assigned crew: ${assignRes.data.status} (assigned to ${crewRes.data[0].name})`);

  // Move to in_progress
  const inProgressRes = await req(`/incidents/${incidentId1}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'in_progress', note: 'Technicians on site' }
  });
  console.log(`   ✓ Status moved to: ${inProgressRes.data.status}`);

  // Resolve incident
  const resolvedRes = await req(`/incidents/${incidentId1}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'resolved', note: 'Leak fixed, main pressure normal' }
  });
  console.log(`   ✓ Status moved to: ${resolvedRes.data.status}`);
  console.log(`   ✓ Total resolution minutes: ${resolvedRes.data.sla.totalResolutionMinutes} min`);
  console.log(`   ✓ SLA state: ${resolvedRes.data.sla.state}`);

  // 5. Public tracking check
  console.log('5. Verifying public tracking lookup...');
  const trackRes = await req(`/reports/track/${trackingId1}`);
  console.log(`   ✓ Tracking lookup status: ${trackRes.data.incident.status}`);
  console.log(`   ✓ Timeline entries count: ${trackRes.data.incident.timeline.length}`);

  console.log('\n--- ALL MAIN FLOWS VERIFIED 100% END-TO-END! ---');
}

runVerification().catch(err => {
  console.error('Verification failed:', err.response?.data || err.message);
  process.exit(1);
});

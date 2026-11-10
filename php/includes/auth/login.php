<?php
//-----------------------------------------
// Login Handler
//-----------------------------------------
// Accepts JSON POST data with username
// and password, validates credentials,
// and starts session if successful.
//-----------------------------------------

//-------------------------------------------------
// CMS-compatible login endpoint
//-------------------------------------------------
require_once __DIR__ . '/../json.header.php';   // Load JSON header definition
require_once __DIR__ . '/../jest.client.php';   // Load CMS root client
//header('Content-Type: application/json');     // Force JSON return

//-----------------------------------------
// Decode JSON input from fetch() body
//-----------------------------------------
// Capture raw POST body and parse JSON
$data    = client()->input();

//-------------------------------------------------
// Validate credentials
//-------------------------------------------------
// Validate required credentials.
$fields  = [ 'username', 'password' ];
$options = [ 'purpose' => 'login' ];
$creds   = client()->parser->parseCredentials( $data, $fields, $options );
dbtlog( $creds );

// Check if credentials validated.
if ( $creds===null ) {
	client()->respond( 400, 'error', $creds, 'User not found or invalid credentials.' );
	exit;
}

// Iterate each field & check status.
$failed  = false;
foreach ( $creds as $key=>$val ) {
	if ( $val['status']==='error' ) { // fail
		$failed = true; // flag for exit
	}
}

// Check if the form failed, exit with error.
if ( $failed===true ) {
	// Return parse info.
	client()->respond( 400, 'error', $creds, 'User not found or invalid credentials.' );
	exit;
}

//-------------------------------------------------
// Run login logic using CMS login module
//-------------------------------------------------
// Try to login.
$result  =
	client()->auth->login(
		$creds['username']['value'],
		$creds['password']['value']
		);

//-------------------------------------------------
// Respond
//-------------------------------------------------
// Return success or failure.
if ( $result['success'] )
	client()->respond( 200, 'success', $result );
else client()->respond( 400, 'error', $creds, $result['error'] );

exit;

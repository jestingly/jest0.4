<?php
//-------------------------------------------------
// CMS-compatible login endpoint
//-------------------------------------------------
require_once __DIR__ . '/../json.header.php';	// Load JSON header definition
require_once __DIR__ . '/../jest.client.php';	// Load CMS root client

//-----------------------------------------
// Decode JSON input from fetch() body
//-----------------------------------------
// Capture raw POST body and parse JSON
$data    = client()->input();

//-------------------------------------------------
// Validate credentials
//-------------------------------------------------
// Validate required credentials.
$fields  = [ 'username', 'email', 'password' ];
$options =
	[
		'purpose'       => 'register',
		'passwordRules' => [
			'minLength'        => 12,
			'requireLetter'    => true,
			'requireNumber'    => true,
			'requireUppercase' => false,
			'requireSymbol'    => false
			]
	];
$creds   = client()->parser->parseCredentials( $data, $fields, $options );
dbtlog( $creds );

// Check if credentials validated.
if ( $creds===null ) {
	client()->respond( 400, 'error', $creds, 'Unexpected form data submission.' );
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
	client()->respond( 400, 'error', $creds, 'Missing or invalid fields.' );
	exit;
}

//-------------------------------------------------
// Run registration logic
//-------------------------------------------------
$result  =
	client()->auth->register(
		$creds['username']['value'],
		$creds['email']['value'],
		$creds['password']['value']
		);

//-------------------------------------------------
// Respond with result
//-------------------------------------------------
// Return success or failure.
if ( $result['success'] )
	client()->respond( 200, 'success', $result );
else client()->respond( 400, 'error', $creds, $result['error'] );

exit;

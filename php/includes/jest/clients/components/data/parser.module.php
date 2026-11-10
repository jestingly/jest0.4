<?php

//-------------------------
// JestParser Class
//-------------------------
// Utility class for validating/sanitizing JSON input arrays
// Used to prevent malformed or unsafe data from propagating
class JestParser extends Gamepiece {
	// Object propert(ies)

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes the module.
	// * $client	- [object] Jest application owning the gamepiece.
	public function __construct( $client ) {
		// Call the parent constructor
		parent::__construct( $client );
	}

	//-------------------------
	// Static: Parse JSON Body
	//-------------------------
	// Reads raw php://input and decodes to [array].
	// RETURNS: [array|null] parsed input or null on error.
	public static function fromJSON() {
		$raw   = file_get_contents( 'php://input' );
		$data  = json_decode( $raw, true );

		return is_array($data) ? $data : null;
	}

	//-------------------------
	// Static: Require Fields
	//-------------------------
	// Validates presence of required keys in $data.
	// RETURNS: [bool] true if all fields exist, false otherwise.
	// * $data		- [array] input array
	// * $fields	- [array] list of required field names
	public static function hasFields( $data, $fields ) {
		// Iterate & check each field.
		foreach ( $fields as $field )
			if ( !isset($data[$field]) || $data[$field]==='' )
				return false;
		// All fields found.
		return true;
	}

	// Validates presence of required keys in $data.
	// RETURNS: [array] of missing field(s) if any.
	// * $data		- [array] input array
	// * $fields	- [array] list of required field names
	public static function missingFields( $data, $fields ) {
		// Create a return result for missing field(s).
		$response = [];
		// Iterate & check each field.
		foreach ( $fields as $field ) {
			if ( !isset($data[$field]) || $data[$field]==='' )
				array_push( $response, $field );
		}
		// Return field(s) missing.
		return $response;
	}

	//-------------------------
	// Static: Sanitize User Data
	//-------------------------
	// Strips unwanted characters and trims strings.
	// RETURNS: [array] sanitized result
	// * $data		- [array] raw input
	// * $fields	- [array] fields to sanitize
	public static function sanitize( $data, $fields ) {
		// Begin return output.
		$out = [];
		// Iterate each field & handle.
		foreach ( $fields as $field ) {
			// Sanitize text fields while preserving non-string input for validation.
			if ( isset($data[$field]) && is_string($data[$field]) )
				$out[$field] = trim( strip_tags( $data[$field] ) );
			else $out[$field] = $data[$field] ?? null;
		}
		// Return sanitzed output.
		return $out;
	}

	//-------------------------
	// Static: Validate Username
	//-------------------------
	// Basic validation of [username] format.
	// RETURNS: [bool] whether valid.
	// * $username - [string]
	public static function validateUsername( $username ) {
		return is_string($username) && preg_match('/^[a-zA-Z0-9_\-]{3,20}$/', $username);
	}

	//-------------------------
	// Static: Validate Email
	//-------------------------
	// Basic validation of [email] format.
	// RETURNS: [bool] whether valid.
	// * $email - [string]
	public static function validateEmail( $email ) {
		return is_string($email) && filter_var( $email, FILTER_VALIDATE_EMAIL );
	}

	//-------------------------
	// Static: Validate Password
	//-------------------------
	// Checks a password against the rules supplied by the caller.
	// RETURNS: [bool] whether the password meets every enabled rule.
	// * $password	- [string] password to validate
	// * $opts		- [array] password rules for this validation
	public static function validatePassword( $password, $opts=[] ) {
		// Keep the current password rules as defaults for existing callers.
		$rules = array_merge(
			[
				'minLength'			=> 6,
				'requireLetter'		=> true,
				'requireNumber'		=> true,
				'requireUppercase'	=> false,
				'requireSymbol'		=> false
			],
			$opts
		);

		// Passwords must be strings before any rule can be applied.
		if ( !is_string($password) )
			return false;

		// Enforce the minimum password length.
		if ( strlen($password)<$rules['minLength'] )
			return false;

		// Enforce a letter when the selected policy requires one.
		if ( $rules['requireLetter'] && !preg_match('/[a-zA-Z]/', $password) )
			return false;

		// Enforce a number when the selected policy requires one.
		if ( $rules['requireNumber'] && !preg_match('/[0-9]/', $password) )
			return false;

		// Enforce an uppercase letter when the selected policy requires one.
		if ( $rules['requireUppercase'] && !preg_match('/[A-Z]/', $password) )
			return false;

		// Enforce a symbol when the selected policy requires one.
		if ( $rules['requireSymbol'] && !preg_match('/[^a-zA-Z0-9]/', $password) )
			return false;

		// The password met every enabled rule.
		return true;
	}

	//-------------------------
	// Static: Parse + Validate Credentials
	//-------------------------
	// Reads and validates a set of user fields.
	// RETURNS: [array|null] sanitized values or null on failure.
	// * $data    - [array] raw input
	// * $fields  - [array] expected field names (ex: ['username','email','password'])
	//   $options - [array] of credential options
	public static function parseCredentials( $data, $fields, $opts=[] ) {
		//--------------------------------
		// Validate required fields
		//--------------------------------
		error_log( gettype($data) );
		$missing  = self::missingFields( $data, $fields );
		if ( count($missing)>0 ) return null;

		//--------------------------------
		// Determine Procedure
		//--------------------------------
		// Select how password fields should be handled for this request.
		$purpose = $opts['purpose'] ?? 'register';
		// Read the registration password rules supplied by the endpoint.
		$passwordRules = $opts['passwordRules'] ?? [];

		//--------------------------------
		// Sanitize all fields
		//--------------------------------
		// Sanitize the field data.
		$clean    = self::sanitize( $data, $fields );
		// Keep the password exactly as submitted; trimming or stripping tags changes it.
		if ( in_array('password',$fields,true) && array_key_exists('password',$data) )
			$clean['password'] = $data['password'];

		//--------------------------------
		// Field-specific validation (if exists)
		//--------------------------------
		// Create return [object].
		$response = [];
		foreach ( $fields as $key ) {
			// Begin field return state.
			$spec = [ 'status'=>'success', 'value'=>null, 'notice'=>null ];
			// Insert response value about field.
			$spec['value'] = $clean[$key]; // default to field input value
			// Determine field & validate.
			switch ( $key ) {
				// Parse username.
				case 'username':
					// Validate the username.
					if ( !self::validateUsername($clean[$key]) ) {
						$spec['notice']  = 'Must be alphanumeric, 3-20 characters long.';
						$spec['status']  = 'error';
					}
					break;
				// Parse email.
				case 'email':
					// Validate the email.
					if ( !self::validateEmail($clean[$key]) ) {
						$spec['notice']  = 'Must be a valid e-mail address.';
						$spec['status']  = 'error';
					}
					break;
				// Parse password.
				case 'password':
					// Reject non-string input for both registration and login.
					if ( !is_string($clean[$key]) ) {
						$spec['notice']  = 'Must be a valid password value.';
						$spec['status']  = 'error';
					}
					// Apply password policy only when a new password is being registered.
					elseif ( $purpose==='register' && !self::validatePassword( $clean[$key], $passwordRules ) ) {
						$spec['notice']  = 'Does not meet the current password requirements.';
						$spec['status']  = 'error';
					}
					break;
			}
			// Store field specs in response.
			$response[$key] = $spec;
		}
		// Return the clean data.
		return $response;
	}
}

?>

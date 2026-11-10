<?php

//-------------------------
// JestAuth Class
//-------------------------
class JestAuth extends Gamepiece {
	// Object propert(ies)

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes the Auth with an existing PDO connection.
	// * $client	- [object] Jest application owning the gamepiece.
	public function __construct( $client ) {
		// Call the parent constructor
		parent::__construct( $client );
	}

	//-------------------------
	// Login Method
	//-------------------------
	// Attempts to log in a user with credentials.
	// RETURNS: [array] response containing success and user data.
	// * $username	- [string] user's login name
	// * $password	- [string] user's input password
	public function login( $username, $password ) {
		// Begin query to check for account.
		$query  = "SELECT * FROM users WHERE username = ?";
		$stmt   = $this->client->mysql->pdo->prepare( $query );
		$stmt->execute( [$username] );
		$user   = $stmt->fetch( PDO::FETCH_ASSOC );

		// Verify the password using its stored hash.
		if ( $user && password_verify($password,$user['password_hash']) ) {
			unset( $user['password_hash'] ); // Remove sensitive field
			$_SESSION['user'] = $user;       // Store in session
			return [ 'success'=>true, 'user'=>$user ];
		}
		
		// User did not successfully login.
		return [ 'success'=>false, 'error'=>'Invalid login.' ];
	}

	//-------------------------
	// Register Method
	//-------------------------
	// Registers a new user with provided credentials.
	// RETURNS: [array] success or error message.
	// * $username	- [string] desired username
	// * $email		- [string] email address
	// * $password	- [string] password to hash
	public function register( $username, $email, $password ) {
		$hash   = password_hash( $password, PASSWORD_DEFAULT );
		$query  = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
		/*error_log( $query );
		error_log( $username );
		error_log( $email );
		error_log( $password );*/

		try {
			$this->client->mysql->pdo->prepare($query)->execute( [ $username, $email, $hash ] );
			return [ 'success'=>true ];
		}
		catch ( Exception $except ) {
			return [ 'success'=>false, 'error'=>'Username or email already exists.' ];
		}
	}
}

?>

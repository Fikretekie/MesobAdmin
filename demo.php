<?php
/**
 * Tutor registration template
 *
 * @package Tutor\Templates
 * @subpackage Dashboard
 * @author Themeum <mailto:support@themeum.com>
 * @link https://themeum.com
 * @since 1.4.3
 */

if( !is_user_logged_in() ) {
	$wrap_class = ' tutor-course-entry-box-login5';
} else {
	$wrap_class = '';
}


?>
<div class="container d-flex flex-column<?php echo esc_attr( $wrap_class );?>" >
	<div class="row align-items-center justify-content-center g-0 min-vh-100">
		<div class="col-lg-5 col-md-8 py-8 py-xl-0">
			<?php if(!get_option( 'users_can_register', false )): ?> 
			    <?php 
			        $args = array(
			            'image_path'    => tutor()->url.'assets/images/construction.png',
			            'title'         => esc_html__('Oooh! Access Denied', 'geeks'),
			            'description'   => esc_html__('You do not have access to this area of the application. Please refer to your system  administrator.', 'geeks'),
			            'button'        => array(
			                'text'      => esc_html__('Go to Home', 'geeks'),
			                'url'       => get_home_url(),
			                'class'     => 'tutor-btn'
			            )
			        );
			        tutor_load_template('feature_disabled', $args); 
			    ?>
			<?php else: 

			$validation_errors = apply_filters( 'tutor_student_register_validation_errors', array() );
			if ( is_array( $validation_errors ) && count( $validation_errors ) ) {
				?>
				<div class="tutor-alert-warning tutor-mb-10 alert alert-warning">
					<ul class="list-unstyled mb-0 tutor-required-fields">
					<?php
					foreach ( $validation_errors as $error_key => $error_value ) {
						?>
						<li><?php echo esc_html( $error_value ); ?></li>
						<?php
					}
					?>
					</ul>
				</div>
				<?php
			}
			?>

			<div class="card shadow" >
				<div class="card-body p-6">
				<?php $login_url   = tutor_utils()->get_option( 'enable_tutor_native_login', null, true, true ) ? '' : wp_login_url( tutor()->current_url ); ?>

					<div class="mb-4">
						<?php geeks_profile_form_branding(); ?>
						<h1 class="mb-1 fw-bold"><?php esc_html_e( 'Sign up', 'geeks' ); ?></h1>
						<span class="tutor-course-entry-box-login">
							<?php esc_html_e( 'Already have an account?', 'geeks' ); ?>

							<a href="<?php echo add_query_arg(array('redirect_to' => tutor()->current_url) ); ?>" class="ms-1"><?php esc_html_e( 'Sign in', 'geeks' ); ?></a>

						</span>
						
					</div>
					<div id="tutor-registration-wrap">
						<?php do_action( 'tutor_before_student_reg_form' ); ?>

						<form method="post" enctype="multipart/form-data" id="tutor-registration-form">

							<input type="hidden" name="tutor_course_enroll_attempt" value="<?php echo isset( $_GET['enrol_course_id'] ) ? (int) $_GET['enrol_course_id'] : ''; ?>">
							<?php do_action( 'tutor_student_reg_form_start' ); ?>

							<?php wp_nonce_field( tutor()->nonce_action, tutor()->nonce ); ?>
							<input type="hidden" value="tutor_register_student" name="tutor_action"/>

							<div class="row row-cols-1">

								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'First Name', 'geeks' ); ?>
									</label>

									<input class="form-control" type="text" name="first_name" value="<?php echo esc_attr( tutor_utils()->input_old( 'first_name' ) ); ?>" placeholder="<?php esc_attr_e( 'First Name', 'geeks' ); ?>" required autocomplete="given-name">
								</div>

								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'Last Name', 'geeks' ); ?>
									</label>

									<input class="form-control" type="text" name="last_name" value="<?php echo esc_attr( tutor_utils()->input_old( 'last_name' ) ); ?>" placeholder="<?php esc_attr_e( 'Last Name', 'geeks' ); ?>" required autocomplete="family-name">
								</div>

								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'Username', 'geeks' ); ?>
									</label>

									<input class="form-control" type="text" name="user_login" class="tutor_user_name" value="<?php echo esc_attr( tutor_utils()->input_old( 'user_login' ) ); ?>" placeholder="<?php esc_attr_e( 'Username', 'geeks' ); ?>" required autocomplete="username">
								</div>

								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'Email', 'geeks' ); ?>
									</label>

									<input class="form-control" type="text" name="email" value="<?php echo esc_attr( tutor_utils()->input_old( 'email' ) ); ?>" placeholder="<?php esc_attr_e( 'Email', 'geeks' ); ?>" required autocomplete="email">
								</div>


								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'Password', 'geeks' ); ?>
									</label>

									<input class="form-control" type="password" name="password" value="<?php echo esc_attr( tutor_utils()->input_old( 'password' ) ); ?>" placeholder="<?php esc_attr_e( 'Password', 'geeks' ); ?>" required autocomplete="new-password">
								</div>

								<div class="mb-3">
									<label class="form-label">
										<?php esc_html_e( 'Password confirmation', 'geeks' ); ?>
									</label>

									<input class="form-control" type="password" name="password_confirmation" value="<?php echo esc_attr( tutor_utils()->input_old( 'password_confirmation' ) ); ?>" placeholder="<?php esc_attr_e( 'Password Confirmation', 'geeks' ); ?>" required autocomplete="new-password">
								</div>
							</div>

							<div class="mb-3">
							<?php
								// providing register_form hook.
								do_action( 'tutor_student_reg_form_middle' );
								do_action( 'register_form' );
							?>
							</div>

							<?php do_action( 'tutor_student_reg_form_end' ); ?>

							<?php
					            $tutor_toc_page_link = tutor_utils()->get_toc_page_link();
					        ?>
					        
					        <?php if( null !== $tutor_toc_page_link ) : ?>
					            <div class="tutor-mb-24">
					                <?php esc_html_e( 'By signing up, I agree with the website\'s', 'geeks' ) ?> <a target="_blank" href="<?php echo esc_url( $tutor_toc_page_link );?>" title="<?php esc_html_e('Terms and Conditions', 'geeks'); ?>"><?php esc_html_e('Terms and Conditions', 'geeks'); ?></a>
					            </div>
					        <?php endif; ?>

							<div class="tutor-form-group tutor-reg-form-btn-wrap d-grid">
								<button type="submit" name="tutor_register_student_btn" value="register" class="btn btn-primary"><?php esc_html_e( 'Register', 'geeks' ); ?></button>
							</div>
							<?php do_action( 'tutor_after_register_button' ); ?>

						</form>
						<?php do_action( 'tutor_after_registration_form_wrap' ); ?>
					</div>

					<?php do_action( 'tutor_after_student_reg_form' ); ?>
				</div><!-- /.card-body -->
			</div><!-- /.card -->
			<?php //tutor_load_template( 'single.course.login' ); ?>
			<?php endif; ?>

		</div>
	</div>
</div>
<?php if ( ! is_user_logged_in() ) {
	tutor_load_template( 'global.login' );
} ?>

<?php
if ( ! is_user_logged_in() ) {
	//tutor_load_template_from_custom_path( tutor()->path . '/views/modal/login.php' );
}
?>


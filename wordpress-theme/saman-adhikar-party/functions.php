<?php
/**
 * Saman Adhikar Party (समान अधिकार पार्टी) Theme Functions
 *
 * @package Saman_Adhikar_Party
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// 1. Enqueue Scripts and Styles
function sap_enqueue_scripts() {
    // Tailwind CSS via CDN
    wp_enqueue_script('tailwind-css', 'https://cdn.tailwindcss.com', array(), '3.4.0', false);
    
    // FontAwesome Icons
    wp_enqueue_style('fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
    
    // Google Fonts
    wp_enqueue_style('sap-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Tiro+Devanagari+Hindi&display=swap', array(), null);

    // Theme Main Stylesheet
    wp_enqueue_style('sap-style', get_stylesheet_uri(), array(), '1.0.0');
}
add_action('wp_enqueue_scripts', 'sap_enqueue_scripts');

// 2. Register Custom Post Types
function sap_register_post_types() {
    // Press Releases CPT
    register_post_type('press_release', array(
        'labels' => array(
            'name' => 'प्रेस विज्ञप्ति (Press Releases)',
            'singular_name' => 'प्रेस विज्ञप्ति',
            'add_new' => 'नई विज्ञप्ति जोड़ें',
            'add_new_item' => 'नई प्रेस विज्ञप्ति जोड़ें',
            'edit_item' => 'विज्ञप्ति संपादित करें',
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-newspaper',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
        'show_in_rest' => true,
    ));

    // Party Members CPT
    register_post_type('sap_member', array(
        'labels' => array(
            'name' => 'पार्टी कार्यकर्ता (Members)',
            'singular_name' => 'कार्यकर्ता',
            'add_new_item' => 'नया कार्यकर्ता जोड़ें',
        ),
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-groups',
        'supports' => array('title', 'custom-fields'),
    ));

    // Donations Record CPT
    register_post_type('sap_donation', array(
        'labels' => array(
            'name' => 'दान रिकॉर्ड (Donations)',
            'singular_name' => 'दान रिकॉर्ड',
        ),
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-money-alt',
        'supports' => array('title', 'custom-fields'),
    ));
}
add_action('init', 'sap_register_post_types');

// 3. Admin Settings Page for SBI Bank Details & Gemini Key
function sap_add_admin_menu() {
    add_menu_page(
        'SAP Party Settings',
        'SAP Party Config',
        'manage_options',
        'sap-settings',
        'sap_render_admin_settings_page',
        'dashicons-flag',
        2
    );
}
add_action('admin_menu', 'sap_add_admin_menu');

function sap_render_admin_settings_page() {
    if (isset($_POST['sap_save_settings']) && check_admin_referer('sap_settings_nonce')) {
        update_option('sap_bank_name', sanitize_text_field($_POST['sap_bank_name']));
        update_option('sap_account_no', sanitize_text_field($_POST['sap_account_no']));
        update_option('sap_ifsc_code', sanitize_text_field($_POST['sap_ifsc_code']));
        update_option('sap_upi_id', sanitize_text_field($_POST['sap_upi_id']));
        update_option('sap_gemini_api_key', sanitize_text_field($_POST['sap_gemini_api_key']));
        echo '<div class="notice notice-success is-dismissible"><p>समान अधिकार पार्टी सेटिंग्स सफलतापूर्वक सहेजी गईं!</p></div>';
    }

    $bank_name = get_option('sap_bank_name', 'भारतीय स्टेट बैंक (State Bank of India)');
    $account_no = get_option('sap_account_no', '34465318239');
    $ifsc_code = get_option('sap_ifsc_code', 'SBIN0002467');
    $upi_id = get_option('sap_upi_id', 'samanadhikarparty@sbi');
    $gemini_key = get_option('sap_gemini_api_key', '');
    ?>
    <div class="wrap">
        <h1>समान अधिकार पार्टी - WordPress कॉन्फ़िगरेशन</h1>
        <form method="post" action="">
            <?php wp_nonce_field('sap_settings_nonce'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="sap_bank_name">बैंक का नाम</label></th>
                    <td><input type="text" id="sap_bank_name" name="sap_bank_name" value="<?php echo esc_attr($bank_name); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th><label for="sap_account_no">खाता संख्या (A/C No)</label></th>
                    <td><input type="text" id="sap_account_no" name="sap_account_no" value="<?php echo esc_attr($account_no); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th><label for="sap_ifsc_code">IFSC कोड</label></th>
                    <td><input type="text" id="sap_ifsc_code" name="sap_ifsc_code" value="<?php echo esc_attr($ifsc_code); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th><label for="sap_upi_id">UPI ID</label></th>
                    <td><input type="text" id="sap_upi_id" name="sap_upi_id" value="<?php echo esc_attr($upi_id); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th><label for="sap_gemini_api_key">Gemini AI API Key</label></th>
                    <td><input type="password" id="sap_gemini_api_key" name="sap_gemini_api_key" value="<?php echo esc_attr($gemini_key); ?>" class="regular-text"></td>
                </tr>
            </table>
            <?php submit_button('सेटिंग्स सहेजें', 'primary', 'sap_save_settings'); ?>
        </form>
    </div>
    <?php
}

// 4. REST API Endpoint for Gemini AI Chat
function sap_register_rest_routes() {
    register_rest_route('sap/v1', '/chat', array(
        'methods' => 'POST',
        'callback' => 'sap_handle_ai_chat',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'sap_register_rest_routes');

function sap_handle_ai_chat($request) {
    $params = $request->get_json_params();
    $message = sanitize_text_field($params['message'] ?? '');
    $apiKey = get_option('sap_gemini_api_key', '');

    if (empty($apiKey)) {
        return new WP_REST_Response(array(
            'reply' => "समान अधिकार पार्टी में आपका स्वागत है!\n\nहमारे राष्ट्रीय अध्यक्ष: **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088)।\n\nमुख्य संकल्प:\n1. आरक्षण प्रणाली समाप्त करना\n2. भारत को हिंदू राष्ट्र घोषित करना\n3. जनसंख्या नियंत्रण कानून\n4. गौमाता को राष्ट्रमाता घोषित करना"
        ), 200);
    }

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' . urlencode($apiKey);
    $payload = array(
        'systemInstruction' => array(
            'parts' => array(array('text' => 'You are official AI spokesperson for Saman Adhikar Party (समान अधिकार पार्टी). Leader: Kuldeep Sharma. Respond in polite patriotic Hindi.'))
        ),
        'contents' => array(
            array('role' => 'user', 'parts' => array(array('text' => $message)))
        )
    );

    $response = wp_remote_post($url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($payload),
        'timeout' => 15
    ));

    if (is_wp_error($response)) {
        return new WP_REST_Response(array('reply' => 'क्षमा करें, सर्वर त्रुटि हुई। कृपया पुनः प्रयास करें।'), 500);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $reply = $body['candidates'][0]['content']['parts'][0]['text'] ?? 'जय हिंदू राष्ट्र! जय गौमाता!';

    return new WP_REST_Response(array('reply' => $reply), 200);
}

// 5. Shortcodes
function sap_donation_form_shortcode() {
    ob_start();
    include get_template_directory() . '/page-donate.php';
    return ob_get_clean();
}
add_shortcode('sap_donation_portal', 'sap_donation_form_shortcode');

function sap_membership_form_shortcode() {
    ob_start();
    include get_template_directory() . '/page-membership.php';
    return ob_get_clean();
}
add_shortcode('sap_membership_portal', 'sap_membership_form_shortcode');

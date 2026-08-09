<?php
/**
 * Gemini AI Campaign Assistant for Saman Adhikar Party in PHP
 * Uses PHP cURL to call Gemini 3.6 Flash API
 */

require_once __DIR__ . '/config.php';

function ask_gemini_assistant($message, $history = []) {
    $apiKey = GEMINI_API_KEY;
    
    if (empty($apiKey)) {
        return "समान अधिकार पार्टी (Saman Adhikar Party) में आपका स्वागत है!\n\n" .
               "हमारे राष्ट्रीय अध्यक्ष: **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088)।\n\n" .
               "हमारे मुख्य संकल्प:\n" .
               "1. **आरक्षण प्रणाली खत्म करें**: केवल प्रतिभा व आवश्यकता के आधार पर अधिकार।\n" .
               "2. **भारत को हिंदू राष्ट्र घोषित करें**: सनातन धर्म व संस्कृति की सुरक्षा।\n" .
               "3. **जनसंख्या नियंत्रण कानून लागू हो**: 'दो बच्चे' का कड़ा नियम।\n" .
               "4. **हर ज़िले में गुरुकुल स्कूल खोलना**: आधुनिक तकनीक व वैदिक संस्कार।\n" .
               "5. **गौमाता को राष्ट्रमाता घोषित करना**: गोवंश संरक्षण एवं गोहत्या पर आजीवन कारावास।\n\n" .
               "दान हेतु SBI बैंक खाता: 34465318239 | IFSC: SBIN0002467 | UPI: samanadhikarparty@sbi";
    }

    $systemInstruction = [
        "parts" => [
            ["text" => "You are 'Saman Adhikar Party AI Assistant' (समान अधिकार पार्टी एआई सहायक), official AI spokesperson for Saman Adhikar Party. Leader: Kuldeep Sharma (राष्ट्रीय अध्यक्ष). Contact: 9412165541, 7310732088. Slogans: 'तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा', 'समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!'. Core Agendas: 1. Abolish Reservation System, 2. Declare India a Hindu Rashtra, 3. Implement Population Control Law, 4. Open Gurukul Schools in Every District, 5. Declare Gaumata as Rashtramata, 6. Mathura Temple Reclamation. Bank Details: State Bank of India, Sadar Bazar Agra, A/C: 34465318239, IFSC: SBIN0002467, UPI: samanadhikarparty@sbi. Respond in polite, patriotic Hindi with clear bullet points."]
        ]
    ];

    $contents = [];
    if (is_array($history)) {
        foreach ($history as $h) {
            $contents[] = [
                'role' => ($h['sender'] === 'user') ? 'user' : 'model',
                'parts' => [['text' => $h['text']]]
            ];
        }
    }

    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $message]]
    ];

    $payload = [
        'systemInstruction' => $systemInstruction,
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.7
        ]
    ];

    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . GEMINI_MODEL . ":generateContent?key=" . urlencode($apiKey);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $result = json_decode($response, true);
        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return $result['candidates'][0]['content']['parts'][0]['text'];
        }
    }

    return "समान अधिकार पार्टी के समर्थन हेतु धन्यवाद! जय हिंदू राष्ट्र, जय गौमाता!";
}

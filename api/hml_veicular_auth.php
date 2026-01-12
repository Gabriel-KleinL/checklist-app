<?php

// Inclui a configuração do banco de dados
require_once 'hml_veicular_config.php';

// Função para gerar um token simples
function gerarToken($userId) {
    // Gera string aleatória compatível com PHP 5.x
    $random = md5(uniqid(mt_rand(), true));
    return base64_encode($userId . ':' . time() . ':' . $random);
}

// Pega os dados da requisição
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log para debug
error_log("AUTH: Requisição recebida - " . print_r($data, true));

// Verifica a ação solicitada
if (!isset($data['acao'])) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Ação não especificada'
    ]);
    exit;
}

$acao = $data['acao'];

// ============================================
// AÇÃO: Definir Senha Inicial
// ============================================
if ($acao === 'definir_senha') {
    // Valida os campos obrigatórios
    if (!isset($data['usuario_id']) || !isset($data['nova_senha'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'ID do usuário e nova senha são obrigatórios'
        ]);
        exit;
    }

    $usuarioId = (int)$data['usuario_id'];
    $novaSenha = trim($data['nova_senha']);

    // Valida a senha
    if (empty($novaSenha) || strlen($novaSenha) < 4) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'A senha deve ter no mínimo 4 caracteres'
        ]);
        exit;
    }

    try {
        // Busca o usuário
        $stmt = $pdo->prepare("SELECT id, nome, senha FROM bbb_usuario WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Usuário não encontrado'
            ]);
            exit;
        }

        // Verifica se o usuário realmente não tem senha
        if (!empty($usuario['senha']) && $usuario['senha'] !== '') {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Usuário já possui senha cadastrada'
            ]);
            exit;
        }

        // Atualiza a senha
        $senhaHash = md5($novaSenha);
        $stmtUpdate = $pdo->prepare("UPDATE bbb_usuario SET senha = :senha WHERE id = :id");
        $stmtUpdate->execute([
            'senha' => $senhaHash,
            'id' => $usuarioId
        ]);

        error_log("AUTH: Senha definida com sucesso para usuário ID: " . $usuarioId);

        http_response_code(200);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Senha criada com sucesso! Faça login novamente.'
        ]);
        exit;

    } catch (PDOException $e) {
        error_log("AUTH: Erro ao definir senha - " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao processar a solicitação'
        ]);
        exit;
    }
}

// ============================================
// AÇÃO: Login
// ============================================
if ($acao === 'login') {

// Valida o campo nome (obrigatório)
if (!isset($data['nome'])) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Nome de usuário é obrigatório'
    ]);
    exit;
}

$nome = trim($data['nome']);
// Senha é opcional - pode ser vazia
$senha = isset($data['senha']) ? $data['senha'] : '';

// Valida se o nome não está vazio
if (empty($nome)) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Nome de usuário não pode estar vazio'
    ]);
    exit;
}

try {
    // Busca o usuário no banco de dados (por nome)
    $stmt = $pdo->prepare("
        SELECT
            id,
            nome,
            senha,
            ativo,
            tipo_usuario,
            tutorial_concluido
        FROM bbb_usuario
        WHERE nome = :nome
        LIMIT 1
    ");

    $stmt->execute(['nome' => $nome]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Log para debug
    error_log("AUTH: Usuário encontrado - " . ($usuario ? 'SIM' : 'NÃO'));

    // Verifica se o usuário existe
    if (!$usuario) {
        http_response_code(401);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Nome de usuário ou senha inválidos'
        ]);
        exit;
    }

    // Verifica se o usuário está ativo
    if ($usuario['ativo'] != 1) {
        http_response_code(401);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Usuário inativo. Entre em contato com o administrador.'
        ]);
        exit;
    }

    // Verifica se a senha está vazia no banco (usuário precisa criar senha)
    if (empty($usuario['senha']) || $usuario['senha'] === '') {
        http_response_code(200);
        echo json_encode([
            'sucesso' => false,
            'precisa_criar_senha' => true,
            'mensagem' => 'Você precisa criar uma senha para acessar o sistema',
            'usuario' => [
                'id' => (int)$usuario['id'],
                'nome' => $usuario['nome']
            ]
        ]);
        exit;
    }

    // Se o usuário tem senha cadastrada mas não enviou senha, não permite
    if (empty($senha)) {
        http_response_code(401);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Por favor, digite sua senha'
        ]);
        exit;
    }

    // Verifica a senha (usando MD5 como no banco de dados)
    $senhaHash = md5($senha);

    error_log("AUTH: Comparando senhas - Hash informado: " . substr($senhaHash, 0, 10) . "...");
    error_log("AUTH: Hash armazenado: " . substr($usuario['senha'], 0, 10) . "...");

    if ($senhaHash !== $usuario['senha']) {
        http_response_code(401);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Nome de usuário ou senha inválidos'
        ]);
        exit;
    }

    // Login bem-sucedido - gera o token
    $token = gerarToken($usuario['id']);

    // Remove a senha do objeto de retorno
    unset($usuario['senha']);

    // Retorna o sucesso com os dados do usuário
    error_log("AUTH: Login bem-sucedido para " . $nome . " (Tipo: " . $usuario['tipo_usuario'] . ")");

    http_response_code(200);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Login realizado com sucesso',
        'usuario' => [
            'id' => (int)$usuario['id'],
            'nome' => $usuario['nome'],
            'ativo' => (bool)$usuario['ativo'],
            'tipo_usuario' => $usuario['tipo_usuario'],
            'tutorial_concluido' => (bool)$usuario['tutorial_concluido']
        ],
        'token' => $token
    ]);
    exit;

} catch (PDOException $e) {
    error_log("AUTH: Erro de banco de dados - " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao processar a solicitação. Tente novamente.'
    ]);
    exit;
}
}

// ============================================
// AÇÃO: Marcar Tutorial como Concluído
// ============================================
elseif ($acao === 'marcar_tutorial_concluido') {
    // Valida o campo usuario_id (obrigatório)
    if (!isset($data['usuario_id'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'ID do usuário é obrigatório'
        ]);
        exit;
    }

    $usuarioId = (int)$data['usuario_id'];

    try {
        // Atualiza o campo tutorial_concluido para true
        $stmt = $pdo->prepare("
            UPDATE bbb_usuario
            SET tutorial_concluido = 1
            WHERE id = :id
        ");

        $stmt->execute(['id' => $usuarioId]);

        // Verifica se alguma linha foi afetada
        if ($stmt->rowCount() > 0) {
            error_log("AUTH: Tutorial marcado como concluído para usuário ID: " . $usuarioId);

            http_response_code(200);
            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Tutorial marcado como concluído'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Usuário não encontrado'
            ]);
        }
    } catch (PDOException $e) {
        error_log("AUTH: Erro ao marcar tutorial - " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao processar a solicitação'
        ]);
    }
    exit;
}

// ============================================
// AÇÃO: Inválida
// ============================================
else {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Ação inválida: ' . $acao
    ]);
    exit;
}

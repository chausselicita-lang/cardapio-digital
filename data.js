// Dados padrão do cardápio — carregados quando não há dados salvos no localStorage
window.MENU_DEFAULT = {
  config: {
    nome: "Sabor & Arte",
    subtitulo: "Bar & Restaurante",
    emoji: "🍽️",
    whatsapp: "5511999999999",
    horario: "Seg–Sex: 11h–23h | Sáb–Dom: 11h–00h",
    endereco: "Rua das Flores, 123 — Centro",
    telefone: "(11) 99999-9999",
    corPrimaria: "#E8420A",
    heroBadge1: "⭐ 4.9 no Google",
    heroBadge2: "🕐 Aberto agora",
    heroBadge3: "🚗 Delivery disponível",
    senhaAdmin: "admin123"
  },
  categorias: [
    { id: "entradas",   nome: "Entradas",   emoji: "🥗", desc: "Para começar com o pé direito" },
    { id: "pratos",     nome: "Pratos",     emoji: "🍖", desc: "O coração do nosso cardápio" },
    { id: "lanches",    nome: "Lanches",    emoji: "🍔", desc: "Artesanais, suculentos e irresistíveis" },
    { id: "pizzas",     nome: "Pizzas",     emoji: "🍕", desc: "Massa fina e recheios generosos" },
    { id: "petiscos",   nome: "Petiscos",   emoji: "🍟", desc: "Perfeitos para compartilhar" },
    { id: "bebidas",    nome: "Bebidas",    emoji: "🍺", desc: "Para acompanhar sua refeição" },
    { id: "sobremesas", nome: "Sobremesas", emoji: "🍰", desc: "O final perfeito para sua refeição" },
    { id: "combos",     nome: "Combos",     emoji: "🎁", desc: "Mais por menos — combinações perfeitas" }
  ],
  produtos: [
    // ── ENTRADAS ──────────────────────────────────────────
    { id:"bruschetta",    cat:"entradas",   nome:"Bruschetta Italiana",       desc:"Pão italiano grelhado com tomate, manjericão fresco e azeite extra virgem",                      preco:24.90, foto:"https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"carpaccio",     cat:"entradas",   nome:"Carpaccio de Carne",        desc:"Fatias finíssimas de filé mignon com rúcula, parmesão e molho especial",                         preco:38.90, foto:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"caesar",        cat:"entradas",   nome:"Salada Caesar",             desc:"Alface romana, croutons crocantes, parmesão e molho caesar da casa",                             preco:29.90, foto:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"caldo-cana",    cat:"entradas",   nome:"Caldo de Cana c/ Limão",    desc:"Caldo de cana natural gelado com um toque de limão siciliano. Refrescante!",                     preco:14.90, foto:"https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=260&fit=crop&auto=format&q=80", tag:"novo",    destaque:false, ativo:true },
    // ── PRATOS ────────────────────────────────────────────
    { id:"picanha",       cat:"pratos",     nome:"Picanha na Brasa",          desc:"300g de picanha grelhada na brasa com arroz, farofa e vinagrete",                                 preco:89.90, foto:"https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:true,  ativo:true },
    { id:"frango",        cat:"pratos",     nome:"Frango Grelhado",           desc:"Peito de frango grelhado com ervas finas, arroz integral e legumes no vapor",                     preco:52.90, foto:"https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"peixe",         cat:"pratos",     nome:"Peixe ao Molho Cítrico",    desc:"Filé de tilápia com molho de laranja e gengibre, acompanha purê de batata",                       preco:64.90, foto:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"risoto",        cat:"pratos",     nome:"Risoto de Camarão",         desc:"Arroz arbóreo cremoso com camarões salteados, vinho branco e manjericão",                         preco:74.90, foto:"https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:true,  ativo:true },
    // ── LANCHES ───────────────────────────────────────────
    { id:"smash",         cat:"lanches",    nome:"Smash Burger Clássico",     desc:"180g de blend smashado, queijo americano, alface, tomate e maionese especial",                    preco:34.90, foto:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"x-bacon",       cat:"lanches",    nome:"X-Bacon Duplo",             desc:"Dois discos de carne, bacon crocante, cheddar derretido e molho barbecue artesanal",               preco:42.90, foto:"https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"veggie",        cat:"lanches",    nome:"Veggie Burger",             desc:"Hambúrguer de grão-de-bico e beterraba, queijo vegano, rúcula e maionese de ervas",                preco:32.90, foto:"https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=260&fit=crop&auto=format&q=80", tag:"novo",    destaque:false, ativo:true },
    { id:"misto",         cat:"lanches",    nome:"Misto Quente Gourmet",      desc:"Pão artesanal, presunto parma, queijo gruyère e mostarda dijon",                                   preco:22.90, foto:"https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    // ── PIZZAS ────────────────────────────────────────────
    { id:"margherita",    cat:"pizzas",     nome:"Pizza Margherita",          desc:"Molho San Marzano, mussarela de búfala, manjericão fresco e azeite",                               preco:54.90, foto:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:true,  ativo:true },
    { id:"pepperoni",     cat:"pizzas",     nome:"Pizza Pepperoni",           desc:"Generosa quantidade de pepperoni importado, mussarela e orégano",                                  preco:62.90, foto:"https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"4queijos",      cat:"pizzas",     nome:"Pizza Quatro Queijos",      desc:"Mussarela, provolone, gorgonzola e parmesão. Para os amantes de queijo!",                          preco:67.90, foto:"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"pizza-frango",  cat:"pizzas",     nome:"Pizza Frango c/ Catupiry",  desc:"Frango desfiado temperado, catupiry original, milho e azeitona verde",                             preco:59.90, foto:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    // ── PETISCOS ──────────────────────────────────────────
    { id:"batata",        cat:"petiscos",   nome:"Batata Frita Crocante",     desc:"Porção 300g de batata palito frita, temperada com sal e ervas. Acompanha molho especial",          preco:28.90, foto:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"bacalhau",      cat:"petiscos",   nome:"Bolinho de Bacalhau",       desc:"8 unidades crocantes por fora, cremosos por dentro. Acompanha maionese de alho",                   preco:36.90, foto:"https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:false, ativo:true },
    { id:"franguinho",    cat:"petiscos",   nome:"Franguinho na Chapa",       desc:"Sobrecoxa de frango temperada e grelhada na chapa, crocante por fora",                             preco:42.90, foto:"https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"mandioca",      cat:"petiscos",   nome:"Mandioca Frita",            desc:"Porção de mandioca cozida e frita, sequinha e temperada. Perfeita com limão",                      preco:24.90, foto:"https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    // ── BEBIDAS ───────────────────────────────────────────
    { id:"chopp",         cat:"bebidas",    nome:"Chopp Artesanal",           desc:"400ml de chopp gelado de fabricação própria. Leve, encorpado e refrescante",                      preco:16.90, foto:"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"caipirinha",    cat:"bebidas",    nome:"Caipirinha Clássica",       desc:"Limão tahiti fresco, cachaça premium, açúcar de cana e muito gelo",                                preco:22.90, foto:"https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:false, ativo:true },
    { id:"suco",          cat:"bebidas",    nome:"Suco Natural 500ml",        desc:"Laranja, maracujá, manga, abacaxi ou melancia. Fresquinho e sem conservante",                      preco:12.90, foto:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"refrigerante",  cat:"bebidas",    nome:"Refrigerante Lata 350ml",   desc:"Coca-Cola, Pepsi, Guaraná, Sprite ou Fanta. Gelado na hora",                                       preco:7.90,  foto:"https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"agua",          cat:"bebidas",    nome:"Água Mineral 500ml",        desc:"Água mineral natural com ou sem gás",                                                               preco:5.00,  foto:"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=260&fit=crop&auto=format&q=80", tag:"",        destaque:false, ativo:true },
    { id:"vinho",         cat:"bebidas",    nome:"Vinho Tinto da Casa",       desc:"Garrafa 750ml selecionada pelo nosso sommelier. Perfeito com carnes e massas",                     preco:89.90, foto:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:true,  ativo:true },
    // ── SOBREMESAS ────────────────────────────────────────
    { id:"petit-gateau",  cat:"sobremesas", nome:"Petit Gâteau",              desc:"Bolinho de chocolate com interior derretido, servido com sorvete de baunilha",                     preco:28.90, foto:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:true,  ativo:true },
    { id:"pudim",         cat:"sobremesas", nome:"Pudim de Leite Condensado", desc:"Pudim caseiro cremoso com calda de caramelo dourada. Receita da vovó!",                            preco:18.90, foto:"https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true },
    { id:"sorvete",       cat:"sobremesas", nome:"Sorvete Artesanal 3 Bolas", desc:"Chocolate belga, baunilha, morango, maracujá ou pistache",                                          preco:22.90, foto:"https://images.unsplash.com/photo-1633933358116-a27b902fad35?w=400&h=260&fit=crop&auto=format&q=80", tag:"novo",    destaque:false, ativo:true },
    // ── COMBOS ────────────────────────────────────────────
    { id:"combo-casal",   cat:"combos", nome:"Combo Casal Clássico",  desc:"2 pratos principais + 2 sobremesas + 2 bebidas",   preco:119.90, precoOriginal:149.90, foto:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true, extras:["2 Pratos à sua escolha","2 Refrigerantes ou Sucos","2 Sobremesas do dia","🎉 Economia de R$ 30,00"] },
    { id:"combo-petisco", cat:"combos", nome:"Combo Petisco + Chopp", desc:"2 petiscos + 2 chopps artesanais gelados",          preco:59.90,  precoOriginal:74.70,  foto:"https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&h=260&fit=crop&auto=format&q=80", tag:"popular", destaque:false, ativo:true, extras:["Bolinho de Bacalhau (8 un)","Batata Frita Crocante","2 Chopps Artesanais 400ml","🎉 Economia de R$ 15,00"] },
    { id:"combo-familia", cat:"combos", nome:"Combo Família",         desc:"Serve até 4 pessoas com fartura",                   preco:189.90, precoOriginal:239.90, foto:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=260&fit=crop&auto=format&q=80", tag:"chef",    destaque:false, ativo:true, extras:["1 Pizza Grande à escolha","2 Porções de Petisco","4 Refrigerantes Lata","4 Sobremesas do dia","🎉 Economia de R$ 50,00"] }
  ]
};

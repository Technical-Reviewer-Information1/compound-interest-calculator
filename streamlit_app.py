import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np

# ページ設定
st.set_page_config(
    page_title="シミュレーション①複利法", 
    page_icon="📈",
    layout="wide"
)

# タイトルとクレジット
st.title("シミュレーション①複利法（pp.89-90）")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

# 複利法の説明
st.header("🎯 複利法とは？")
st.write("""
**複利法（複利計算）** は、元本に対してだけでなく、これまでに生じた利息に対しても利息が付く計算方法です。

### 複利の計算式
```
将来価値 = 元本 × (1 + 利率)^期間
```

### 複利の特徴
- **時間の経過とともに加速度的に増加**: 利息に利息がつくため、時間が経つほど効果が大きくなります
- **「時間」の重要性**: 早く始めるほど、複利の効果を最大限に活用できます
- **Einstein の言葉**: 「複利は人類最大の発明」と呼ばれるほど強力な概念です

下のスライダーを調整して、複利の効果を体験してみましょう！
""")

st.divider()

# パラメータ設定
st.header("⚙️ パラメータ設定")

col1, col2, col3 = st.columns(3)

with col1:
    principal = st.slider(
        "元本 (万円)", 
        min_value=10, 
        max_value=1000, 
        value=100, 
        step=10,
        help="投資を開始する時の元手資金"
    )

with col2:
    annual_rate = st.slider(
        "年利率 (%)", 
        min_value=1.0, 
        max_value=15.0, 
        value=5.0, 
        step=0.5,
        help="年間の利率（%）"
    )

with col3:
    years = st.slider(
        "投資期間 (年)", 
        min_value=1, 
        max_value=50, 
        value=20, 
        step=1,
        help="投資を続ける年数"
    )

# 複利計算関数
def calculate_compound_interest(principal, rate, years):
    rate_decimal = rate / 100
    data = []
    
    for year in range(years + 1):
        amount = principal * (1 + rate_decimal) ** year
        interest = amount - principal
        data.append({
            'Year': year,
            'Amount': amount,
            'Interest': interest,
            'Principal': principal
        })
    
    return pd.DataFrame(data)

# 単利計算関数（比較用）
def calculate_simple_interest(principal, rate, years):
    rate_decimal = rate / 100
    data = []
    
    for year in range(years + 1):
        interest = principal * rate_decimal * year
        amount = principal + interest
        data.append({
            'Year': year,
            'Amount': amount,
            'Interest': interest,
            'Principal': principal
        })
    
    return pd.DataFrame(data)

# 計算実行
df_compound = calculate_compound_interest(principal, annual_rate, years)
df_simple = calculate_simple_interest(principal, annual_rate, years)

st.divider()

# 結果表示
st.header("📊 計算結果")

col1, col2, col3, col4 = st.columns(4)

final_compound = df_compound.iloc[-1]['Amount']
final_simple = df_simple.iloc[-1]['Amount']
compound_interest = df_compound.iloc[-1]['Interest']
difference = final_compound - final_simple

with col1:
    st.metric(
        "複利での最終金額", 
        f"{final_compound:,.0f}万円",
        delta=f"+{compound_interest:,.0f}万円"
    )

with col2:
    st.metric(
        "単利での最終金額", 
        f"{final_simple:,.0f}万円",
        delta=f"+{df_simple.iloc[-1]['Interest']:,.0f}万円"
    )

with col3:
    st.metric(
        "複利と単利の差", 
        f"{difference:,.0f}万円",
        delta=f"{(difference/principal*100):,.1f}%の差"
    )

with col4:
    st.metric(
        "投資倍率", 
        f"{final_compound/principal:.2f}倍",
        delta=f"年率{annual_rate}%で{years}年間"
    )

st.divider()

# グラフ表示
st.header("📈 複利効果の可視化")

# メインの複利グラフ
fig = go.Figure()

# 複利のライン
fig.add_trace(go.Scatter(
    x=df_compound['Year'],
    y=df_compound['Amount'],
    mode='lines+markers',
    name='複利',
    line=dict(color='#ff6b6b', width=3),
    marker=dict(size=6),
    hovertemplate='<b>複利</b><br>年数: %{x}年<br>金額: %{y:,.0f}万円<extra></extra>'
))

# 単利のライン（比較用）
fig.add_trace(go.Scatter(
    x=df_simple['Year'],
    y=df_simple['Amount'],
    mode='lines+markers',
    name='単利 (比較)',
    line=dict(color='#4ecdc4', width=2, dash='dash'),
    marker=dict(size=4),
    hovertemplate='<b>単利</b><br>年数: %{x}年<br>金額: %{y:,.0f}万円<extra></extra>'
))

# 元本のライン
fig.add_hline(
    y=principal, 
    line_dash="dot", 
    line_color="gray",
    annotation_text="元本",
    annotation_position="right"
)

fig.update_layout(
    title=f"複利効果の比較（元本: {principal}万円、年利: {annual_rate}%）",
    xaxis_title="投資年数",
    yaxis_title="金額 (万円)",
    hovermode='x unified',
    height=500,
    showlegend=True,
    legend=dict(
        yanchor="top",
        y=0.99,
        xanchor="left",
        x=0.01
    )
)

st.plotly_chart(fig, use_container_width=True)

# 積み上げ棒グラフ（元本と利息の内訳）
st.subheader("💰 元本と利息の内訳")

# 5年ごとのデータを抽出
step = max(1, years // 10)
df_subset = df_compound[df_compound['Year'] % step == 0].copy()

fig2 = go.Figure()

fig2.add_trace(go.Bar(
    x=df_subset['Year'],
    y=df_subset['Principal'],
    name='元本',
    marker_color='#a8e6cf',
    hovertemplate='<b>元本</b><br>年数: %{x}年<br>金額: %{y:,.0f}万円<extra></extra>'
))

fig2.add_trace(go.Bar(
    x=df_subset['Year'],
    y=df_subset['Interest'],
    name='利息',
    marker_color='#ff8b94',
    hovertemplate='<b>利息</b><br>年数: %{x}年<br>金額: %{y:,.0f}万円<extra></extra>'
))

fig2.update_layout(
    title="元本と利息の推移",
    xaxis_title="投資年数",
    yaxis_title="金額 (万円)",
    barmode='stack',
    height=400,
    hovermode='x unified'
)

st.plotly_chart(fig2, use_container_width=True)

# 年間の成長率グラフ
st.subheader("📊 年間成長率の推移")

if years > 1:
    growth_rates = []
    for i in range(1, len(df_compound)):
        prev_amount = df_compound.iloc[i-1]['Amount']
        curr_amount = df_compound.iloc[i]['Amount']
        growth_rate = ((curr_amount - prev_amount) / prev_amount) * 100
        growth_rates.append(growth_rate)
    
    fig3 = go.Figure()
    
    fig3.add_trace(go.Bar(
        x=list(range(1, years + 1)),
        y=growth_rates,
        name='年間成長率',
        marker_color='#ffd93d',
        hovertemplate='<b>年間成長率</b><br>年数: %{x}年目<br>成長率: %{y:.2f}%<extra></extra>'
    ))
    
    fig3.add_hline(
        y=annual_rate, 
        line_dash="dot", 
        line_color="red",
        annotation_text=f"設定年利率: {annual_rate}%",
        annotation_position="right"
    )
    
    fig3.update_layout(
        title="各年の実質成長率",
        xaxis_title="投資年数",
        yaxis_title="成長率 (%)",
        height=400,
        showlegend=False
    )
    
    st.plotly_chart(fig3, use_container_width=True)

st.divider()

# データテーブル
st.header("📋 詳細データ")

# 表示用データフレームの準備
display_df = df_compound.copy()
display_df['元本'] = display_df['Principal'].apply(lambda x: f"{x:,.0f}万円")
display_df['利息'] = display_df['Interest'].apply(lambda x: f"{x:,.0f}万円")
display_df['合計金額'] = display_df['Amount'].apply(lambda x: f"{x:,.0f}万円")

# 年間増加額の計算
display_df['年間増加額'] = 0
for i in range(1, len(display_df)):
    increase = display_df.iloc[i]['Amount'] - display_df.iloc[i-1]['Amount']
    display_df.iloc[i, display_df.columns.get_loc('年間増加額')] = f"{increase:,.0f}万円"

display_df.iloc[0, display_df.columns.get_loc('年間増加額')] = "-"

# 表示用カラムの選択
display_columns = ['Year', '元本', '利息', '合計金額', '年間増加額']
display_df_final = display_df[display_columns].copy()
display_df_final = display_df_final.rename(columns={'Year': '年数'})

st.dataframe(
    display_df_final,
    use_container_width=True,
    hide_index=True
)

# 学習ポイント
st.header("💡 学習ポイント")

col1, col2 = st.columns(2)

with col1:
    st.info("""
    **🚀 複利の威力**
    - 時間が経つほど加速度的に増加
    - {years}年後の差額: {difference:,.0f}万円
    - 複利は単利の{ratio:.2f}倍の効果
    """.format(
        years=years,
        difference=difference,
        ratio=final_compound/final_simple
    ))

with col2:
    st.warning("""
    **⏰ 時間の重要性**
    - 早く始めるほど有利
    - 1年遅れると大きな機会損失
    - 「時間」は最大の武器
    """)

# フッター
st.divider()
st.markdown("""
<div style='text-align: center; color: gray; font-size: 0.8em;'>
💡 このアプリで複利の力を実感し、投資や貯蓄の重要性を学んでいただけたでしょうか？<br>
パラメータを変更して、様々なシナリオを試してみてください！
</div>
""", unsafe_allow_html=True)
